

export function applyMethod(obj, method, args) {
    if (args == null) return obj[method]()
    switch (args.length) {
        case 0:  return obj[method]()
        case 1:  return obj[method](args[0])
        case 2:  return obj[method](args[0], args[1])
        case 3:  return obj[method](args[0], args[1], args[2])
        default: return obj[method].apply(obj, args)
    }
}


export function cloneDeep(val) {
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


export function isPlainObject(obj) {
    if (!(obj && typeof obj == 'object')) return false
    let proto = Object.getPrototypeOf(obj)
    return proto == null || proto === Object.prototype
}


export function getPrototypeChain(Constructor) {
    let result = []
    if (typeof Constructor !== 'function' || !Constructor.prototype)
        throw new Error('Prototype chain for invalid constructor')
    let proto = Constructor.prototype
    while(proto) {
        result.push(proto)
        proto = Object.getPrototypeOf(proto)
    }
    return result
}
