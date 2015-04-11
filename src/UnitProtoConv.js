const UnitConv = require('./UnitConv'),
    {getProtoChain, isStr, isFunc} = require('./util')


module.exports = class UnitProtoConv extends UnitConv {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create proto converter: ${err}`)

        this.proto      = spec.proto
        this.token      = spec.token
        this.namespace  = spec.namespace
        this.path       = (this.namespace ? this.namespace + '.' : '') + this.token
        this.protoChain = getProtoChain(this.proto, true)

        this.restore    = spec.restore || this._defaultRestore

        let dump  = spec.dump
        switch (true) {
            case typeof dump === 'function': this.dump = dump; break
            case typeof dump === 'string':   this.dump = (val) => val[dump](); break
            default:                         this.dump = this._defaultDump
        }
    }
    

    validateSpec(s) {
        if (s instanceof UnitProtoConv) return
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
            case s.proto == null:                 break
            case typeof s.proto === 'object':     break
            case typeof s.proto === 'function':   break
            default:                              return `invalid proto for ${s.token}`
        }
        switch (true) {
            case s.restore == null:               break
            case typeof s.restore === 'function': break
            default:                              return `invalid restore method for ${s.token}`
        }
        switch (true) {
            case !s.dump:                         break
            case typeof s.dump === 'function':    break
            case typeof s.dump === 'string':      break
            default:                              return `invalid dump method for ${s.token}`
        }
    }


    _defaultDump(val) {
        let result = {}
        for (let key in val) {
            if (val.hasOwnProperty(key)) result[key] = val[key]
        }
        return result
    }


    _defaultRestore(dumped) {
        let result = Object.create(this.proto)
        for (let key in dumped) result[key] = dumped[key]
        return result
    }
}
