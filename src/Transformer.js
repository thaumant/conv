const {
    chain,
    compact,
    filter,
    find,
    has,
    isArray,
    isEmpty,
    isFunction,
    isPlainObject,
    isString,
    isUndefined,
    keys,
    map,
    mapValues,
    uniq,
    pluck
} = require('lodash')



 
export default class Transformer {
    constructor(specs, params={}) {
        let err = this.validateSpecs(specs) || this.validateConsistency(specs)
        if (err) throw new Error(`Failed to create transformer: ${err}`)

        this.prefix = params.prefix || '$'
        this.parser = params.parser || JSON
        this.specs  = specs
        this._hasPredicates = !isEmpty(filter(specs, 'pred'))
    }


    validateSpecs(specs) {
        if (!isArray(specs)) return 'expected array of specs'
        for (let i in specs) {
            let err = this.validateSpec(specs[i])
            if (err) return err
        }
    }

    /*
        Validate the presence and type for each spec property:
            - token
            - class / predicate
            - encoder
            - decoder (optional)
    */
    validateSpec(s) {
        if (!isPlainObject(s))                             return 'spec is not a plain object'
        if (!isString(s.token) || isEmpty(s.token))        return 'missing token'
        if (!isFunction(s.class) && !isFunction(s.pred))   return 'missing class or predicate'
        if (!isFunction(s.encode))                         return 'missing encode method'
        if (!isFunction(s.decode) && has(s, 'decode'))     return 'invalid decode method'
    }

    /*
        To exclude ambiguity assert that for each token:
            - there are one and only one decoder
            - there are at least one encoder
    */
    validateConsistency(specs) {
        let tokens = uniq(pluck(specs, 'token'))
        for (let i in tokens) {
            let token    = tokens[i],
                relSpecs = filter(specs, (s) => s.token === token),
                decoders = compact(pluck(relSpecs, 'decode')),
                encoders = compact(pluck(relSpecs, 'encode'))
            if (decoders.length !== 1) return `${decoders.length} decoders for token ${token}`
            if (encoders.length < 1)   return `no encoders for token ${token}`
        }
    }

}
