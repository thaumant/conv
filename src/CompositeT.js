const {cloneDeep, applyMethod, isPlainObject, isArr, isFunc, isObj} = require('./util.js')

const UnitT    = require('./UnitT.js'),
    UnitClassT = require('./UnitClassT.js'),
    UnitProtoT = require('./UnitProtoT.js'),
    UnitPredT  = require('./UnitPredT.js')


module.exports = class CompositeT {
    constructor(specs, opts={}) {
        let err

        this.options = {
            prefix:     opts.prefix || '$',
            serializer: opts && opts.serializer || this._defaultSerializer()
        }
        err = this.validateSerializer(this.options.serializer)
        if (err) throw new Error(`Invalid serializer: ${err}`)

        if (!isArr(specs)) throw new Error('Expected array of specs')
        this.unitTs  = specs.map(this.makeUnitT)
        this.predTs  = this.unitTs.filter((t) => t instanceof UnitPredT)
        this.classTs = this.unitTs
            .filter((t) => t instanceof UnitClassT)
            .sort((t1, t2) => t2.protoChain.length - t1.protoChain.length)
        this.protoTs = this.unitTs
            .filter((t) => t instanceof UnitProtoT)
            .sort((t1, t2) => t2.protoChain.length - t1.protoChain.length)

        err = this.validateConsistency(this.unitTs)
        if (err) throw new Error(`Inconsistent transformers: ${err}`)
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
        for (let i = 0; i < this.predTs.length; i++) {
            let predT = this.predTs[i]
            if (predT.pred(val)) {
                let dumped = predT.dump(val)
                return { [this.options.prefix + predT.path]: this._dump(dumped, true) }
            }
        }
        if (!val || typeof val !== 'object') {
            return val
        }
        for (let i = 0; i < this.classTs.length; i++) {
            if (!(val instanceof this.classTs[i].class)) continue
            let classT = this.classTs[i],
                dumped = classT.dump(val)
            return { [this.options.prefix + classT.path]: this._dump(dumped, true) }
        }
        for (let i = 0; i < this.protoTs.length; i++) {
            let protoT = this.protoTs[i]
            if (!protoT.proto.isPrototypeOf(val)) continue
            let dumped = protoT.dump(val)
            return { [this.options.prefix + protoT.path]: this._dump(dumped, true) }
        }
        if (val.constructor === Array) {
            let copy = mutate ? val : []
            for (let i = 0; i < val.length; i++) copy[i] = this._dump(val[i])
            return copy
        }
        if (isPlainObject(val)) {
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
        let keys = Object.keys(val)
        if (keys.length === 1 && keys[0].startsWith(this.options.prefix)) {
            let key = keys[0],
                path = key.slice(this.options.prefix.length)
            for (let i = 0; i < this.unitTs.length; i++) {
                let unitT = this.unitTs[i]
                if (unitT.path === path) {
                    let restoredChildren = this._restore(val[key])
                    return unitT.restore(restoredChildren)
                }
            }
        }
        for (let i in val) val[i] = this._restore(val[i])
        return val
    }


    extendWith(specs, options) {
        if (!isArr(specs)) return this.extendWith([specs], options)
        let result = []
        this.unitTs.concat(specs).forEach((spec) => {
            if (spec instanceof CompositeT) {
                spec.unitTs.forEach((unitT) => result.push(unitT))
            } else {
                result.push(spec)
            }
        })
        return new CompositeT(result, options || this.options)
    }


    overrideBy(specs, options) {
        if (!isArr(specs)) return this.overrideBy([specs], options)
        let result = []
        this.unitTs.concat(specs).reverse().forEach((spec) => {
            if (spec instanceof CompositeT) {
                spec.unitTs.reverse().forEach((unitT) => {
                    result.unshift(unitT)
                    if (this.validateConsistency(result)) result.shift()
                })
                options = spec.options
            } else {
                result.unshift(spec)
                if (this.validateConsistency(result)) result.shift()
            }
        })
        return new CompositeT(result, options || this.options)
    }


    withOptions(opts={}) {
        return new CompositeT(this.unitTs, {
            prefix:     opts.prefix     || this.options.prefix,
            serializer: opts.serializer || this.options.serializer
        })
    }


    makeUnitT(spec) {
        switch (true) {
            case spec instanceof UnitT: return spec
            case spec && !!spec.class:  return new UnitClassT(spec)
            case spec && !!spec.proto:  return new UnitProtoT(spec)
            case spec && !!spec.pred:   return new UnitPredT(spec)
            default: throw new Error('Invalid spec, no class, prototype or predicate')
        }
    }


    validateConsistency(unitTs) {
        for (let i in unitTs) {
            let unitT     = unitTs[i],
                token     = unitT.token,
                ns        = unitT.namespace,
                sameNs    = unitTs.filter((s) => s.namespace === ns),
                sameToken = sameNs.filter((s) => s.token === token)
            if (sameToken.length > 1)  return `${sameToken.length} transformers for token ${token}`
            if (unitT instanceof UnitClassT) {
                let sameClass = unitTs.filter((t) => t.class === unitT.class)
                if (sameClass.length > 1) return `${sameClass.length} transformers for class ${unitT.class.name}`
            }
            if(unitT instanceof UnitProtoT) {
                let sameProto = unitTs.filter((t) => t.proto === unitT.proto)
                if (sameProto.length > 1) return `${sameProto.length} transformers for proto ${unitT.token}`
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