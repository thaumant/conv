"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _require = require("./util.js");

var cloneDeep = _require.cloneDeep;
var isPlainObject = _require.isPlainObject;
var isArr = _require.isArr;
var isFunc = _require.isFunc;
var isObj = _require.isObj;
var getFunctionName = _require.getFunctionName;
var has = _require.has;

var UnitConv = require("./UnitConv.js"),
    UnitClassConv = require("./UnitClassConv.js"),
    UnitProtoConv = require("./UnitProtoConv.js"),
    UnitPredConv = require("./UnitPredConv.js");

module.exports = (function () {
    function CompositeConv(specs) {
        var opts = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, CompositeConv);

        var err = undefined;

        this.options = {
            prefix: opts.prefix || "$",
            serializer: opts && opts.serializer || this._defaultSerializer()
        };
        err = this.validateSerializer(this.options.serializer);
        if (err) throw new Error("Invalid serializer: " + err);

        if (!isArr(specs)) throw new Error("Expected array of specs");
        this.unitConvs = specs.map(this.makeUnitConv);
        this.predConvs = this.unitConvs.filter(function (t) {
            return t instanceof UnitPredConv;
        });
        this.classConvs = this.unitConvs.filter(function (t) {
            return t instanceof UnitClassConv;
        }).sort(function (t1, t2) {
            return t2.protoChain.length - t1.protoChain.length;
        });
        this.protoConvs = this.unitConvs.filter(function (t) {
            return t instanceof UnitProtoConv;
        }).sort(function (t1, t2) {
            return t2.protoChain.length - t1.protoChain.length;
        });

        err = this.validateConsistency(this.unitConvs);
        if (err) throw new Error("Inconsistent converters: " + err);
    }

    _createClass(CompositeConv, {
        serialize: {
            value: function serialize() {
                var s = this.options.serializer;
                arguments[0] = this.dump(arguments[0]);
                return arguments.length === 1 ? s.serialize(arguments[0]) : s.serialize.apply(s, arguments);
            }
        },
        parse: {
            value: function parse() {
                var s = this.options.serializer,
                    parsed = arguments.length === 1 ? s.parse(arguments[0]) : s.parse.apply(s, arguments);
                return this.restoreUnsafe(parsed);
            }
        },
        dump: {
            value: function dump(val) {
                return this._dump(val);
            }
        },
        _dump: {
            value: function _dump(val) {
                var mutate = arguments[1] === undefined ? false : arguments[1];

                for (var i = 0; i < this.predConvs.length; i++) {
                    var conv = this.predConvs[i];
                    if (conv.pred(val)) {
                        var dumped = conv.dump(val);
                        return _defineProperty({}, this.options.prefix + conv.path, this._dump(dumped, true));
                    }
                }
                if (!val || typeof val !== "object") {
                    return val;
                }
                for (var i = 0; i < this.classConvs.length; i++) {
                    if (!(val instanceof this.classConvs[i]["class"])) continue;
                    var conv = this.classConvs[i],
                        dumped = conv.dump(val);
                    return _defineProperty({}, this.options.prefix + conv.path, this._dump(dumped, true));
                }
                for (var i = 0; i < this.protoConvs.length; i++) {
                    var conv = this.protoConvs[i];
                    if (!conv.proto.isPrototypeOf(val)) continue;
                    var dumped = conv.dump(val);
                    return _defineProperty({}, this.options.prefix + conv.path, this._dump(dumped, true));
                }
                if (val.constructor === Array) {
                    var copy = mutate ? val : [];
                    for (var i = 0; i < val.length; i++) {
                        copy[i] = this._dump(val[i]);
                    }return copy;
                }
                var proto = Object.getPrototypeOf(val);
                if (proto === null || proto === Object.prototype) {
                    var copy = mutate ? val : {};
                    for (var key in val) {
                        if (val.hasOwnProperty(key)) copy[key] = this._dump(val[key]);
                    }
                    return copy;
                }
                return val;
            }
        },
        restore: {
            value: function restore(val) {
                return this._restore(cloneDeep(val));
            }
        },
        restoreUnsafe: {
            value: function restoreUnsafe(val) {
                return this._restore(val);
            }
        },
        _restore: {
            value: function _restore(val) {
                if (!val || typeof val !== "object") {
                    return val;
                }
                if (val.constructor === Array) {
                    for (var i = 0; i < val.length; i++) {
                        val[i] = this._restore(val[i]);
                    }return val;
                }
                var keys = Object.keys(val),
                    prefix = this.options.prefix;
                if (keys.length === 1 && keys[0].slice(0, prefix.length) === prefix) {
                    var key = keys[0],
                        path = key.slice(prefix.length);
                    for (var i = 0; i < this.unitConvs.length; i++) {
                        var conv = this.unitConvs[i];
                        if (conv.path === path) {
                            var restoredChildren = this._restore(val[key]);
                            return conv.restore(restoredChildren);
                        }
                    }
                }
                for (var i in val) {
                    val[i] = this._restore(val[i]);
                }return val;
            }
        },
        extendWith: {
            value: function extendWith(specs, options) {
                if (!isArr(specs)) {
                    return this.extendWith([specs], options);
                }var result = [];
                this.unitConvs.concat(specs).forEach(function (spec) {
                    if (spec instanceof CompositeConv) {
                        spec.unitConvs.forEach(function (conv) {
                            return result.push(conv);
                        });
                    } else {
                        result.push(spec);
                    }
                });
                return new this.constructor(result, options || this.options);
            }
        },
        overrideBy: {
            value: function overrideBy(specs, options) {
                var _this = this;

                if (!isArr(specs)) {
                    return this.overrideBy([specs], options);
                }var result = [];
                this.unitConvs.concat(specs).reverse().forEach(function (spec) {
                    if (spec instanceof CompositeConv) {
                        spec.unitConvs.reverse().forEach(function (conv) {
                            result.unshift(conv);
                            if (_this.validateConsistency(result)) result.shift();
                        });
                        options = spec.options;
                    } else {
                        result.unshift(spec);
                        if (_this.validateConsistency(result)) result.shift();
                    }
                });
                return new this.constructor(result, options || this.options);
            }
        },
        withOptions: {
            value: function withOptions() {
                var opts = arguments[0] === undefined ? {} : arguments[0];

                return new this.constructor(this.unitConvs, {
                    prefix: opts.prefix || this.options.prefix,
                    serializer: opts.serializer || this.options.serializer
                });
            }
        },
        makeUnitConv: {
            value: function makeUnitConv(spec) {
                switch (true) {
                    case spec instanceof UnitConv:
                        return spec;
                    case spec && !!spec["class"]:
                        return new UnitClassConv(spec);
                    case spec && !!spec.proto:
                        return new UnitProtoConv(spec);
                    case spec && !!spec.pred:
                        return new UnitPredConv(spec);
                    default:
                        throw new Error("Invalid spec, no class, prototype or predicate");
                }
            }
        },
        exclude: {
            value: function exclude() {
                var selected = arguments[0] === undefined ? {} : arguments[0];

                var unitConvs = this.unitConvs;
                if (!isObj(selected)) {
                    return this;
                }switch (true) {
                    case Boolean(selected["class"]):
                        unitConvs = unitConvs.filter(function (u) {
                            return u["class"] !== selected["class"];
                        });
                        break;
                    case Boolean(selected.proto):
                        unitConvs = unitConvs.filter(function (u) {
                            return u.proto !== selected.proto;
                        });
                        break;
                    case Boolean(selected.token):
                        unitConvs = unitConvs.filter(function (u) {
                            return u.namespace != selected.namespace || u.token !== selected.token;
                        });
                        break;
                    case Boolean(selected.namespace):
                        unitConvs = unitConvs.filter(function (u) {
                            return u.namespace !== selected.namespace;
                        });
                        break;
                    default:
                        null;
                }
                return new this.constructor(unitConvs, this.optionsn);
            }
        },
        validateConsistency: {
            value: function validateConsistency(unitConvs) {
                for (var i in unitConvs) {
                    var _ret = (function (i) {
                        var conv = unitConvs[i],
                            token = conv.token,
                            ns = conv.namespace,
                            sameNs = unitConvs.filter(function (s) {
                            return s.namespace === ns;
                        }),
                            sameToken = sameNs.filter(function (s) {
                            return s.token === token;
                        });
                        if (sameToken.length > 1) return {
                                v: "" + sameToken.length + " converters for token " + token
                            };
                        if (conv instanceof UnitClassConv) {
                            var sameClass = unitConvs.filter(function (t) {
                                return t["class"] === conv["class"];
                            });
                            if (sameClass.length > 1) return {
                                    v: "" + sameClass.length + " converters for class " + getFunctionName(conv["class"])
                                };
                        }
                        if (conv instanceof UnitProtoConv) {
                            var sameProto = unitConvs.filter(function (t) {
                                return t.proto === conv.proto;
                            });
                            if (sameProto.length > 1) return {
                                    v: "" + sameProto.length + " converters for proto " + conv.token
                                };
                        }
                    })(i);

                    if (typeof _ret === "object") {
                        return _ret.v;
                    }
                }
            }
        },
        validateSerializer: {
            value: function validateSerializer(s) {
                switch (false) {
                    case isObj(s):
                        return "not an object";
                    case isFunc(s.serialize):
                        return "serialize method is not a function";
                    case isFunc(s.parse):
                        return "parse method is not a function";
                    default:
                        return undefined;
                }
            }
        },
        _defaultSerializer: {
            value: function _defaultSerializer() {
                return {
                    serialize: JSON.stringify,
                    parse: JSON.parse
                };
            }
        }
    });

    return CompositeConv;
})();
/* varargs */ /* varargs */