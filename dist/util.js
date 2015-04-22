"use strict";

function has(obj, key) {
    if (!isObj(obj)) {
        return false;
    }return obj.hasOwnProperty(key);
}

function cloneDeep(val) {
    if (val instanceof Array) {
        return val.map(function (child) {
            return cloneDeep(child);
        });
    } else if (val && typeof val === "object") {
        var copy = {};
        for (var key in val) {
            if (val.hasOwnProperty(key)) copy[key] = cloneDeep(val[key]);
        }
        return copy;
    } else {
        return val;
    }
}

function isPlainObject(obj) {
    if (!(obj && typeof obj === "object")) {
        return false;
    }var proto = Object.getPrototypeOf(obj);
    return proto == null || proto === Object.prototype;
}

function isFunc(val) {
    return typeof val === "function";
}

function isStr(val) {
    return typeof val === "string";
}

function isNum(val) {
    return typeof val === "number";
}

function isObj(val) {
    if (!val) {
        return false;
    }var t = typeof val;
    return t === "object" || t === "function";
}

function isArr(val) {
    return val instanceof Array;
}

function getFunctionName(func) {
    if (typeof func !== "function") {
        return null;
    }var match = func.toString().match(/^function ([a-z_$][a-z_$\d]+)\(/i);
    return match && match[1];
}

function getProtoChain(val) {
    var inclusive = arguments[1] === undefined ? false : arguments[1];

    var result = inclusive ? [val] : [];
    if (!(val && typeof val === "object")) {
        return result;
    }var proto = Object.getPrototypeOf(val);
    while (proto != null) {
        result.push(proto);
        proto = Object.getPrototypeOf(proto);
    }
    return result;
}

exports.has = has;
exports.cloneDeep = cloneDeep;
exports.isPlainObject = isPlainObject;
exports.getProtoChain = getProtoChain;
exports.isFunc = isFunc;
exports.isStr = isStr;
exports.isNum = isNum;
exports.isArr = isArr;
exports.isObj = isObj;
exports.getFunctionName = getFunctionName;