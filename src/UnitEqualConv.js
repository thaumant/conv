const UnitConv = require('./UnitConv'),
    {getProtoChain, isStr, isFunc} = require('./util')


module.exports = class UnitEqualConv extends UnitConv {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create equality converter: ${err}`)

        this.value      = spec.value
        this.token      = spec.token
        this.namespace  = spec.namespace
        this.path       = (this.namespace ? this.namespace + '.' : '') + this.token

        this.dump       = spec.dump
        this.restore    = spec.restore
    }
    

    validateSpec(s) {
        if (s instanceof UnitEqualConv) return
        let err = super.validateSpec(s)
        if (err) return err

        switch (true) {
            case s.token == null:                 return 'missing token'
            case this.isValidName(s.token):       break
            default:                              return 'invalid token'
        }
        switch (true) {
            case s.namespace == null:             break
            case this.isValidNS(s.namespace):     break
            default:                              return `invalid namespace for ${s.token}`
        }
        switch (true) {
            case s.restore == null:               return `missing restore method for ${s.token}`
            case typeof s.restore === 'function': break
            default:                              return `invalid restore method for ${s.token}`
        }
        switch (true) {
            case s.dump == null:                  return `missing dump method for ${s.token}`
            case typeof s.dump === 'string':      break
            default:                              return `invalid dump method for ${s.token}`
        }
    }

}
