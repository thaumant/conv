const UnitConv = require('./UnitConv'),
    {isFunc, isStr} = require('./util')


module.exports = class UnitPredConv extends UnitConv {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create predicate converter: ${err}`)
        this.token     = spec.token
        this.pred      = spec.pred
        this.dump      = spec.dump
        this.restore   = spec.restore
        this.namespace = spec.namespace
        this.path      = (this.namespace ? this.namespace + '.' : '') + this.token
    }

    validateSpec(s) {
        if (s instanceof UnitPredConv)           return
        let err = super.validateSpec(s)
        if (err)                              return err
        switch (true) {
            case s.token == null:             return 'missing token'
            case this.isValidName(s.token):   break
            default:                          return 'invalid token'
        }
        switch (true) {
            case s.namespace == null:         break
            case this.isValidNS(s.namespace): break
            default:                          return `invalid namespace for ${s.token}`
        }
        if (!isFunc(s.pred))    return `invalid predicate for ${s.token}`
        if (!isFunc(s.dump))    return `missing dump method for ${s.token}`
        if (!isFunc(s.restore)) return `missing restore method for ${s.token}`
    }
}