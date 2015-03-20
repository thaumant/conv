const {mapValues, map, isPlainObject} = require('lodash')

const UnitTransformer    = require('./UnitTransformer.js'),
    ClassTransformer     = require('./ClassTransformer.js'),
    PredicateTransformer = require('./PredicateTransformer.js')


module.exports = class CompositeTransformer {
    constructor(specs, options={}) {
        this.options = {
            prefix:     options.prefix || '$',
            serializer: options.serializer || JSON
        }
        if (!(specs instanceof Array)) throw new Error('Expected array of specs')
        this.transformers      = specs.map(this.makeUnitTransformer)
        this.predTransformers  = this.transformers.filter((s) => s instanceof PredicateTransformer)
        this.classTransformers = this.transformers.filter((s) => s instanceof ClassTransformer)
        let err = this.validateConsistency(this.transformers)
        if (err) throw new Error(`Inconsistent transformers: ${err}`)
    }

    encode(val) { return this._encode(val) }

    _encode(val, mutate=false) {
        if (val && typeof val.constructor === 'function') {
            for (let i in this.classTransformers) {
                if (val.constructor !== this.classTransformers[i].class) continue
                let {token, encode} = this.classTransformers[i],
                    encoded = encode(val)
                return { [this.options.prefix + token]: this._encode(encoded, true) }
            }
        }
        for (let i in this.predTransformers) {
            let transformer = this.predTransformers[i]
            if (transformer.pred(val)) {
                let {token, encode} = transformer,
                    encoded = encode(val)
                return { [this.options.prefix + token]: this._encode(encoded, true) }
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

    makeUnitTransformer(spec) {
        switch (true) {
            case spec && !!spec.class: return new ClassTransformer(spec)
            case spec && !!spec.pred:  return new PredicateTransformer(spec)
            default: throw new Error('Invalid spec, no class or predicate')
        }
    }

    validateConsistency(transformers) {
        for (let i in transformers) {
            let trans     = transformers[i],
                token     = trans.token,
                sameToken = transformers.filter((s) => s.token === token)
            if (sameToken.length > 1)  return `${sameToken.length} transformers for token ${token}`
            if (trans instanceof ClassTransformer) {
                let sameClass = transformers.filter((t) => t.class === trans.class)
                if (sameClass.length > 1) return `${sameClass.length} transformers for class ${trans.class.name}`
            }
        }
    }
}