const {cloneDeep, mapValues, map, isPlainObject} = require('lodash')

const UnitT    = require('./UnitT.js'),
    UnitClassT = require('./UnitClassT.js'),
    UnitPredT  = require('./UnitPredT.js')


module.exports = class CompositeT {
    constructor(specs, options={}) {
        this.options = {
            prefix:     options.prefix || '$',
            serializer: options.serializer || JSON
        }
        if (!(specs instanceof Array)) throw new Error('Expected array of specs')
        this.unitTs  = specs.map(this.makeUnitT)
        this.predTs  = this.unitTs.filter((s) => s instanceof UnitPredT)
        this.classTs = this.unitTs.filter((s) => s instanceof UnitClassT)
        let err = this.validateConsistency(this.unitTs)
        if (err) throw new Error(`Inconsistent transformers: ${err}`)
    }


    encode(val) { return this._encode(val) }


    _encode(val, mutate=false) {
        if (val && typeof val.constructor === 'function') {
            for (let i in this.classTs) {
                if (val.constructor !== this.classTs[i].class) continue
                let trans = this.classTs[i],
                    encoded = trans.encode(val)
                return { [this.options.prefix + trans.path]: this._encode(encoded, true) }
            }
        }
        for (let i in this.predTs) {
            let trans = this.predTs[i]
            if (trans.pred(val)) {
                let encoded = trans.encode(val)
                return { [this.options.prefix + trans.path]: this._encode(encoded, true) }
            }
        }
        {
            let mapper
            if (val instanceof Array) mapper = map
            else if (isPlainObject(val)) mapper = mapValues
            if (mapper) {
                if (mutate) {
                    for (let i in val) val[i] = this._encode(val[i])
                    return val
                } else {
                    return mapper(val, (child) => this._encode(child))
                }
            }
        }
        return val
    }


    decode(val) { return this._decode(cloneDeep(val)) }


    decodeUnsafe(val) { return this._decode(val) }


    _decode(val) {
        if (val instanceof Array) {
            for (let i in val) val[i] = this._decode(val[i])
            return val
        }
        if (val instanceof Object) {
            let _keys = Object.keys(val)
            if (_keys.length === 1 && _keys[0].startsWith(this.options.prefix)) {
                let key = _keys[0],
                    path = key.slice(this.options.prefix.length)
                for (let i in this.unitTs) {
                    let trans = this.unitTs[i]
                    if (trans.path === path) {
                        let decodedChildren = this._decode(val[key])
                        return trans.decode(decodedChildren)
                    }
                }
            }
            for (let i in val) val[i] = this._decode(val[i])
            return val
        }
        return val
    }


    extendWith(specs, options) {
        if (!(specs instanceof Array)) return this.extendWith([specs], options)
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
        if (!(specs instanceof Array)) return this.overrideBy([specs], options)
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


    makeUnitT(spec) {
        switch (true) {
            case spec instanceof UnitT: return spec
            case spec && !!spec.class:  return new UnitClassT(spec)
            case spec && !!spec.pred:   return new UnitPredT(spec)
            default: throw new Error('Invalid spec, no class or predicate')
        }
    }


    validateConsistency(unitTs) {
        for (let i in unitTs) {
            let trans     = unitTs[i],
                token     = trans.token,
                ns        = trans.namespace,
                sameNs    = unitTs.filter((s) => s.namespace === ns),
                sameToken = sameNs.filter((s) => s.token === token)
            if (sameToken.length > 1)  return `${sameToken.length} transformers for token ${token}`
            if (trans instanceof UnitClassT) {
                let sameClass = unitTs.filter((t) => t.class === trans.class)
                if (sameClass.length > 1) return `${sameClass.length} transformers for class ${trans.class.name}`
            }
        }
    }
}