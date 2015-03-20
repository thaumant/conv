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
    }

    makeUnitTransformer(spec) {
        return spec && spec.class ? new ClassTransformer(spec) : new PredicateTransformer(spec)
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