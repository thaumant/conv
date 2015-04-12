const UnitConv = require('./UnitConv'),
    {getProtoChain, isFunc, isStr, getFunctionName} = require('./util')


module.exports = class UnitClassConv extends UnitConv {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create class converter: ${err}`)

        this.class      = spec.class
        this.token      = spec.token     || getFunctionName(spec.class)
        this.restore    = spec.restore   || (dumped) => new spec.class(dumped)
        this.namespace  = spec.namespace
        this.path       = (this.namespace ? this.namespace + '.' : '') + this.token
        this.protoChain = getProtoChain(this.class.prototype, true)

        let dump  = spec.dump
        switch (true) {
            case isFunc(dump): this.dump = dump; break
            case isStr(dump):  this.dump = (val) => val[dump](); break
            default:           this.dump = (val) => val.toJSON()
        }
    }

    validateSpec(s) {
        if (s instanceof UnitClassConv) return
        let err = super.validateSpec(s)
        if (err) return err

        let maybeToken = (this.isValidName(s.token) && s.token) || getFunctionName(s.class),
            forToken = maybeToken ? ` for ${maybeToken}` : ''

        switch (true) {
            case !maybeToken:                 return 'missing token and no class name'
            case s.token == null:             break
            case this.isValidName(s.token):   break
            default:                          return `invalid token${forToken}`
        }
        switch (true) {
            case s.namespace == null:         break
            case this.isValidNS(s.namespace): break
            default:                          return `invalid namespace${forToken}`
        }
        switch (true) {
            case isFunc(s.class):             break            
            default:                          return `invalid class${forToken}`
        }
        switch (true) {
            case s.restore == null:           break
            case isFunc(s.restore):           break
            default:                          return `invalid restore method${forToken}`
        }
        switch (true) {
            case isFunc(s.class.prototype.toJSON)
                && s.dump == null:            break
            case s.dump == null:              return `missing dump method${forToken}`
            case isFunc(s.dump):              break
            case isStr(s.dump):               break
            default:                          return `invalid dump method${forToken}`
        }
    }
}