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
    } = require('lodash'),
    {inspect} = require('util')


const MUTATE = true

 
export default class Transformer {
    constructor(specs, params={}) {
        let err = this.validateSpecs(specs) || this.validateConsistency(specs)
        if (err) throw new Error(`Failed to create transformer: ${err}`)

        this.prefix = params.prefix || '$'
        this.serializer = params.serializer || JSON
        this.specs = specs
        this._predSpecs = filter(specs, 'pred')
        this._classSpecs = filter(specs, 'class')
    }

    /*
        Try to pick encoder:
            - check if some class matches
            - check if some predicate matches
            - convert children if array or plain object
            - otherwise leave as is
    */
    encode(val) { return this._encode(val) }

    _encode(val, mutate=false) {
        if (val && typeof val.constructor === 'function') {
            for (let i in this._classSpecs) {
                if (val.constructor !== this._classSpecs[i].class) continue
                let {token, encode} = this._classSpecs[i],
                    encoded = encode(val)
                return { [this.prefix + token]: this.encode(encoded, MUTATE) }
            }
        }
        for (let i in this._predSpecs) {
            let spec = this._predSpecs[i]
            if (spec.pred(val)) {
                let {token, encode} = spec,
                    encoded = encode(val)
                return { [this.prefix + token]: this.encode(encoded, MUTATE) }
            }
        }
        {
            let mapper
            if (val instanceof Array) mapper = map
            else if (isPlainObject(val)) mapper = mapValues
            if (mapper) {
                if (mutate) {
                    for (let i in val) val[i] = this.encode(val[i])
                    return val
                } else {
                    return mapper(val, (child) => this.encode(child))
                }
            }
        }
        return val
    }


    decode(val) {
        if (val instanceof Array) {
            return map(val, (child) => this.decode(child))
        }
        if (val instanceof Object) {
            let _keys = Object.keys(val)
            if (_keys.length === 1 && _keys[0].startsWith(this.prefix)) {
                let key = _keys[0],
                    token = key.slice(this.prefix.length)
                for (let i in this.specs) {
                    let spec = this.specs[i]
                    if (spec.token === token && spec.decode) {
                        let decodedChildren = this.decode(val[key])
                        return spec.decode(decodedChildren)
                    }
                }
            }
            return mapValues(val, (child) => this.decode(child))
        }
        return val
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
