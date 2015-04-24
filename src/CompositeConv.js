const {cloneDeep, isPlainObject, isArr, isFunc, isObj, getFunctionName, has} = require('./util.js')

const UnitConv    = require('./UnitConv.js'),
    UnitClassConv = require('./UnitClassConv.js'),
    UnitProtoConv = require('./UnitProtoConv.js'),
    UnitPredConv  = require('./UnitPredConv.js')


module.exports = class CompositeConv {
    constructor(specs, opts={}) {
        let err

        this.options = {
            prefix:     opts.prefix || '$',
            serializer: opts && opts.serializer || this._defaultSerializer()
        }
        err = this.validateSerializer(this.options.serializer)
        if (err) throw new Error(`Invalid serializer: ${err}`)

        if (!isArr(specs)) throw new Error('Expected array of specs')
        this.unitConvs  = specs.map(this.makeUnitConv)
        this.predConvs  = this.unitConvs.filter((t) => t instanceof UnitPredConv)
        this.classConvs = this.unitConvs
            .filter((t) => t instanceof UnitClassConv)
            .sort((t1, t2) => t2.protoChain.length - t1.protoChain.length)
        this.protoConvs = this.unitConvs
            .filter((t) => t instanceof UnitProtoConv)
            .sort((t1, t2) => t2.protoChain.length - t1.protoChain.length)

        err = this.validateConsistency(this.unitConvs)
        if (err) throw new Error(`Inconsistent converters: ${err}`)
    }


    serialize(/* varargs */) {
        let s = this.options.serializer
        arguments[0] = this.dump(arguments[0])
        return arguments.length === 1
            ? s.serialize(arguments[0])
            : s.serialize.apply(s, arguments)
    }


    parse(/* varargs */) {
        let s = this.options.serializer,
            parsed = arguments.length === 1
                ? s.parse(arguments[0])
                : s.parse.apply(s, arguments)
        return this.restoreUnsafe(parsed)
    }


    dump(val) { return this._dump(val) }


    _dump(val, mutate=false) {
        for (let i = 0; i < this.predConvs.length; i++) {
            let conv = this.predConvs[i]
            if (conv.pred(val)) {
                let dumped = conv.dump(val)
                return { [this.options.prefix + conv.path]: this._dump(dumped, true) }
            }
        }
        if (!val || typeof val !== 'object') {
            return val
        }
        for (let i = 0; i < this.classConvs.length; i++) {
            if (!(val instanceof this.classConvs[i].class)) continue
            let conv = this.classConvs[i],
                dumped = conv.dump(val)
            return { [this.options.prefix + conv.path]: this._dump(dumped, true) }
        }
        for (let i = 0; i < this.protoConvs.length; i++) {
            let conv = this.protoConvs[i]
            if (!conv.proto.isPrototypeOf(val)) continue
            let dumped = conv.dump(val)
            return { [this.options.prefix + conv.path]: this._dump(dumped, true) }
        }
        if (val.constructor === Array) {
            let copy = mutate ? val : []
            for (let i = 0; i < val.length; i++) copy[i] = this._dump(val[i])
            return copy
        }
        let proto = Object.getPrototypeOf(val)
        if (proto === null || proto === Object.prototype) {
            let copy = mutate ? val : {}
            for (let key in val) {
                if (val.hasOwnProperty(key)) copy[key] = this._dump(val[key])
            }
            return copy
        }
        return val
    }


    restore(val) { return this._restore(cloneDeep(val)) }


    restoreUnsafe(val) { return this._restore(val) }


    _restore(val) {
        if (!val || typeof val !== 'object') {
            return val
        }
        if (val.constructor === Array) {
            for (let i = 0; i < val.length; i++) val[i] = this._restore(val[i])
            return val
        }
        let keys = Object.keys(val),
            prefix = this.options.prefix
        if (keys.length === 1 && keys[0].slice(0, prefix.length) === prefix) {
            let key = keys[0],
                path = key.slice(prefix.length)
            for (let i = 0; i < this.unitConvs.length; i++) {
                let conv = this.unitConvs[i]
                if (conv.path === path) {
                    let restoredChildren = this._restore(val[key])
                    return conv.restore(restoredChildren)
                }
            }
        }
        for (let i in val) val[i] = this._restore(val[i])
        return val
    }


    extendWith(specs, options) {
        if (!isArr(specs)) return this.extendWith([specs], options)
        let result = []
        this.unitConvs.concat(specs).forEach((spec) => {
            if (spec instanceof CompositeConv) {
                spec.unitConvs.forEach((conv) => result.push(conv))
            } else {
                result.push(spec)
            }
        })
        return new this.constructor(result, options || this.options)
    }


    overrideBy(specs, options) {
        if (!isArr(specs)) return this.overrideBy([specs], options)
        let result = []
        this.unitConvs.concat(specs).reverse().forEach((spec) => {
            if (spec instanceof CompositeConv) {
                spec.unitConvs.reverse().forEach((conv) => {
                    result.unshift(conv)
                    if (this.validateConsistency(result)) result.shift()
                })
                options = spec.options
            } else {
                result.unshift(spec)
                if (this.validateConsistency(result)) result.shift()
            }
        })
        return new this.constructor(result, options || this.options)
    }


    withOptions(opts={}) {
        return new this.constructor(this.unitConvs, {
            prefix:     opts.prefix     || this.options.prefix,
            serializer: opts.serializer || this.options.serializer
        })
    }


    makeUnitConv(spec) {
        switch (true) {
            case spec instanceof UnitConv: return spec
            case spec && !!spec.class:     return new UnitClassConv(spec)
            case spec && !!spec.proto:     return new UnitProtoConv(spec)
            case spec && !!spec.pred:      return new UnitPredConv(spec)
            default: throw new Error('Invalid spec, no class, prototype or predicate')
        }
    }


    exclude(selected={}) {
        let unitConvs = this.unitConvs
        if (!isObj(selected)) return this
        switch (true) {
            case Boolean(selected.class):
                unitConvs = unitConvs.filter((u) => u.class !== selected.class)
                break
            case Boolean(selected.proto):
                unitConvs = unitConvs.filter((u) => u.proto !== selected.proto)
                break
            case Boolean(selected.token):
                unitConvs = unitConvs.filter((u) => u.namespace != selected.namespace || u.token !== selected.token)
                break
            case Boolean(selected.namespace):
                unitConvs = unitConvs.filter((u) => u.namespace !== selected.namespace)
                break
            default: null
        }
        return new this.constructor(unitConvs, this.optionsn)
    }


    validateConsistency(unitConvs) {
        for (let i in unitConvs) {
            let conv      = unitConvs[i],
                token     = conv.token,
                ns        = conv.namespace,
                sameNs    = unitConvs.filter((s) => s.namespace === ns),
                sameToken = sameNs.filter((s) => s.token === token)
            if (sameToken.length > 1)  return `${sameToken.length} converters for token ${token}`
            if (conv instanceof UnitClassConv) {
                let sameClass = unitConvs.filter((t) => t.class === conv.class)
                if (sameClass.length > 1) return `${sameClass.length} converters for class ${getFunctionName(conv.class)}`
            }
            if(conv instanceof UnitProtoConv) {
                let sameProto = unitConvs.filter((t) => t.proto === conv.proto)
                if (sameProto.length > 1) return `${sameProto.length} converters for proto ${conv.token}`
            }
        }
    }


    validateSerializer(s) {
        switch (false) {
            case isObj(s):            return 'not an object'
            case isFunc(s.serialize): return 'serialize method is not a function'
            case isFunc(s.parse):     return 'parse method is not a function'
            default:                  return undefined
        }
    }


    _defaultSerializer() {
        return {
            serialize: JSON.stringify,
            parse:     JSON.parse
        }
    }
}