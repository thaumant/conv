const {isPlainObject} = require('lodash')


module.exports = class UnitT {
    constructor(spec) { }

    validateSpec(s) {
        if (!isPlainObject(s))   return 'spec is not a plain object'
        if (!s.class && !s.pred) return 'spec is missing class or predicate'
    }

    isValidName(str) {
        return typeof str === 'string' && /^[a-zA-Z\$_][a-zA-Z\$_\d]*$/i.test(str)
    }

    isValidNamespace(str) {
        if (typeof str !== 'string') return false
        let parts = str.split('.')
        for (let i in parts) {
            if (!this.isValidName(parts[i])) return false
        }
        return true
    }
}