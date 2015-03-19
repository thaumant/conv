const {isPlainObject} = require('lodash')


module.exports = class UnitTransformer {
    constructor(spec) { }

    validateSpec(s) {
        if (!isPlainObject(s))   return 'spec is not a plain object'
        if (!s.class && !s.pred) return 'spec is missing class or predicate'
    }
}