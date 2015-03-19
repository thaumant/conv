const UnitTransformer = require('./UnitTransformer')


module.exports = class ClassTransformer extends UnitTransformer {
    constructor(spec) {
        let err = this.validateSpec(spec)
        if (err) throw new Error(`Failed to create class transformer: ${err}`)

        this.class  = spec.class
        this.token  = spec.token  || spec.class.name
        this.decode = spec.decode || (encoded) => new spec.class(encoded)

        let encode  = spec.encode
        switch (true) {
            case typeof encode === 'function': this.encode = encode; break
            case typeof encode === 'string':   this.encode = (val) => val[encode](); break
            default:                           this.encode = (val) => val.toJSON()
        }
    }

    validateSpec(s) {
        let err = super.validateSpec(s)
        if (err) return err

        let tokenIsString = typeof s.token === 'string',
            maybeToken = (tokenIsString && s.token) || (s.class && s.class.name),
            forToken = maybeToken ? ` for ${maybeToken}` : ''

        if (s.token && !tokenIsString)                           return `invalid token${forToken}`
        if ((typeof s.class !== 'function') || !s.class.name)    return `invalid class${forToken}`
        if (s.decode && (typeof s.decode !== 'function'))        return `invalid decoder${forToken}`
        switch (true) {
            case !s.encode &&
                 typeof s.class.prototype.toJSON === 'function': break
            case !s.encode:                                      return `missing encoder${forToken}`
            case typeof s.encode === 'function':                 break
            case typeof s.encode === 'string':                   break
            default:                                             return `invalid encoder${forToken}`
        }
    }
}