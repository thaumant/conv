const {isPlainObject} = require('./util')


module.exports = class UnitConv {

    validateSpec(s) {
        if (s instanceof UnitConv)  return
        if (!isPlainObject(s))   return 'spec is not a plain object'
    }

    isValidName(str) {
        return typeof str === 'string' && /^[a-zA-Z\$_][a-zA-Z\$_\d]*$/i.test(str)
    }

    isValidNS(str) {
        if (typeof str !== 'string') return false
        let parts = str.split('.')
        for (let i in parts) {
            if (!this.isValidName(parts[i])) return false
        }
        return true
    }
}