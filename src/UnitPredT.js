const UnitT = require('./UnitT')


module.exports = class UnitPredT extends UnitT {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create predicate transformer: ${err}`)
        this.token     = spec.token
        this.pred      = spec.pred
        this.encode    = spec.encode
        this.decode    = spec.decode
        this.namespace = spec.namespace || null
        this.path      = (this.namespace ? this.namespace + '.' : '') + this.token
    }

    validateSpec(s) {
        let err = super.validateSpec(s)
        if (err)                                return err
        if (!s.token)                           return 'missing token'
        if (!this.isValidName(s.token))         return 'invalid token'
        if (s.namespace &&
           !this.isValidNamespace(s.namespace)) return `invalid namespace for ${s.token}`
        if (typeof s.pred   !== 'function')     return `invalid predicate for ${s.token}`
        if (typeof s.encode !== 'function')     return `missing encoder for ${s.token}`
        if (typeof s.decode !== 'function')     return `missing decoder for ${s.token}`
    }
}