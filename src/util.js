
function applyMethod(obj, method, args) {
    if (args == null) return obj[method]()
    switch (args.length) {
        case 0:  return obj[method]()
        case 1:  return obj[method](args[0])
        case 2:  return obj[method](args[0], args[1])
        case 3:  return obj[method](args[0], args[1], args[2])
        default: return obj[method].apply(obj, args)
    }
}


function cloneDeep(val) {
    if (val instanceof Array) {
        return val.map((child) => cloneDeep(child))
    } else if (val && typeof val == 'object') {
        let copy = {}
        for (let key in val) {
            if (val.hasOwnProperty(key)) copy[key] = cloneDeep(val[key])
        }
        return copy
    } else {
        return val
    }
}


function isPlainObject(obj) {
    if (!(obj && typeof obj == 'object')) return false
    let proto = Object.getPrototypeOf(obj)
    return proto == null || proto === Object.prototype
}


function getProtoChain(val, inclusive=false) {
    let result = inclusive ? [val] : []
    if (!(val && typeof val === 'object')) return result
    let proto = Object.getPrototypeOf(val)
    while(proto != null) {
        result.push(proto)
        proto = Object.getPrototypeOf(proto)
    }
    return result
}


exports.applyMethod = applyMethod
exports.cloneDeep = cloneDeep
exports.isPlainObject = isPlainObject
exports.getProtoChain = getProtoChain
