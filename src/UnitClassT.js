const UnitT = require('./UnitT')


module.exports = class UnitClassT extends UnitT {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create class transformer: ${err}`)

        this.class     = spec.class
        this.token     = spec.token     || spec.class.name
        this.restore   = spec.restore   || (dumped) => new spec.class(dumped)
        this.namespace = spec.namespace || null
        this.path      = (this.namespace ? this.namespace + '.' : '') + this.token

        let dump  = spec.dump
        switch (true) {
            case typeof dump === 'function': this.dump = dump; break
            case typeof dump === 'string':   this.dump = (val) => val[dump](); break
            default:                         this.dump = (val) => val.toJSON()
        }
    }

    validateSpec(s) {
        if (s instanceof UnitClassT) return
        let err = super.validateSpec(s)
        if (err) return err

        let maybeToken = (this.isValidName(s.token) && s.token) || (s.class && s.class.name),
            forToken = maybeToken ? ` for ${maybeToken}` : ''

        if (!maybeToken)                                         return 'missing token and no class name'
        if (s.token && !this.isValidName(s.token))               return `invalid token${forToken}`
        if (s.namespace && !this.isValidNamespace(s.namespace))  return `invalid namespace${forToken}`
        if (typeof s.class !== 'function')                       return `invalid class${forToken}`
        if (s.restore && (typeof s.restore !== 'function'))      return `invalid restore method${forToken}`
        switch (true) {
            case !s.dump &&
                 typeof s.class.prototype.toJSON === 'function': break
            case !s.dump:                                        return `missing dump method${forToken}`
            case typeof s.dump === 'function':                   break
            case typeof s.dump === 'string':                     break
            default:                                             return `invalid dump method${forToken}`
        }
    }
}