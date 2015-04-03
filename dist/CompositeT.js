"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _require = require("./util.js");

var cloneDeep = _require.cloneDeep;
var applyMethod = _require.applyMethod;
var isPlainObject = _require.isPlainObject;
var isArr = _require.isArr;

var UnitT = require("./UnitT.js"),
    UnitClassT = require("./UnitClassT.js"),
    UnitProtoT = require("./UnitProtoT.js"),
    UnitPredT = require("./UnitPredT.js");

module.exports = (function () {
    function CompositeT(specs) {
        var options = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, CompositeT);

        this.options = {
            prefix: options.prefix || "$",
            serializer: options.serializer || JSON
        };
        if (!isArr(specs)) throw new Error("Expected array of specs");
        this.unitTs = specs.map(this.makeUnitT);
        this.predTs = this.unitTs.filter(function (t) {
            return t instanceof UnitPredT;
        });
        this.classTs = this.unitTs.filter(function (t) {
            return t instanceof UnitClassT;
        }).sort(function (t1, t2) {
            return t2.protoChain.length - t1.protoChain.length;
        });
        this.protoTs = this.unitTs.filter(function (t) {
            return t instanceof UnitProtoT;
        }).sort(function (t1, t2) {
            return t2.protoChain.length - t1.protoChain.length;
        });
        var err = this.validateConsistency(this.unitTs);
        if (err) throw new Error("Inconsistent transformers: " + err);
    }

    _createClass(CompositeT, {
        dump: {
            value: function dump(val) {
                return this._dump(val);
            }
        },
        _dump: {
            value: function _dump(val) {
                var mutate = arguments[1] === undefined ? false : arguments[1];

                for (var i = 0; i < this.predTs.length; i++) {
                    var predT = this.predTs[i];
                    if (predT.pred(val)) {
                        var dumped = predT.dump(val);
                        return _defineProperty({}, this.options.prefix + predT.path, this._dump(dumped, true));
                    }
                }
                if (!val || typeof val !== "object") {
                    return val;
                }
                for (var i = 0; i < this.classTs.length; i++) {
                    if (!(val instanceof this.classTs[i]["class"])) continue;
                    var classT = this.classTs[i],
                        dumped = classT.dump(val);
                    return _defineProperty({}, this.options.prefix + classT.path, this._dump(dumped, true));
                }
                for (var i = 0; i < this.protoTs.length; i++) {
                    var protoT = this.protoTs[i];
                    if (!protoT.proto.isPrototypeOf(val)) continue;
                    var dumped = protoT.dump(val);
                    return _defineProperty({}, this.options.prefix + protoT.path, this._dump(dumped, true));
                }
                if (val.constructor === Array) {
                    var copy = mutate ? val : [];
                    for (var i = 0; i < val.length; i++) {
                        copy[i] = this._dump(val[i]);
                    }return copy;
                }
                if (isPlainObject(val)) {
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
                var keys = Object.keys(val);
                if (keys.length === 1 && keys[0].startsWith(this.options.prefix)) {
                    var key = keys[0],
                        path = key.slice(this.options.prefix.length);
                    for (var i = 0; i < this.unitTs.length; i++) {
                        var unitT = this.unitTs[i];
                        if (unitT.path === path) {
                            var restoredChildren = this._restore(val[key]);
                            return unitT.restore(restoredChildren);
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
                this.unitTs.concat(specs).forEach(function (spec) {
                    if (spec instanceof CompositeT) {
                        spec.unitTs.forEach(function (unitT) {
                            return result.push(unitT);
                        });
                    } else {
                        result.push(spec);
                    }
                });
                return new CompositeT(result, options || this.options);
            }
        },
        overrideBy: {
            value: function overrideBy(specs, options) {
                var _this = this;

                if (!isArr(specs)) {
                    return this.overrideBy([specs], options);
                }var result = [];
                this.unitTs.concat(specs).reverse().forEach(function (spec) {
                    if (spec instanceof CompositeT) {
                        spec.unitTs.reverse().forEach(function (unitT) {
                            result.unshift(unitT);
                            if (_this.validateConsistency(result)) result.shift();
                        });
                        options = spec.options;
                    } else {
                        result.unshift(spec);
                        if (_this.validateConsistency(result)) result.shift();
                    }
                });
                return new CompositeT(result, options || this.options);
            }
        },
        withOptions: {
            value: function withOptions() {
                var opts = arguments[0] === undefined ? {} : arguments[0];

                return new CompositeT(this.unitTs, {
                    prefix: opts.prefix || this.options.prefix,
                    serializer: opts.serializer || this.options.serializer
                });
            }
        },
        makeUnitT: {
            value: function makeUnitT(spec) {
                switch (true) {
                    case spec instanceof UnitT:
                        return spec;
                    case spec && !!spec["class"]:
                        return new UnitClassT(spec);
                    case spec && !!spec.proto:
                        return new UnitProtoT(spec);
                    case spec && !!spec.pred:
                        return new UnitPredT(spec);
                    default:
                        throw new Error("Invalid spec, no class, prototype or predicate");
                }
            }
        },
        validateConsistency: {
            value: function validateConsistency(unitTs) {
                for (var i in unitTs) {
                    var _ret = (function (i) {
                        var unitT = unitTs[i],
                            token = unitT.token,
                            ns = unitT.namespace,
                            sameNs = unitTs.filter(function (s) {
                            return s.namespace === ns;
                        }),
                            sameToken = sameNs.filter(function (s) {
                            return s.token === token;
                        });
                        if (sameToken.length > 1) return {
                                v: "" + sameToken.length + " transformers for token " + token
                            };
                        if (unitT instanceof UnitClassT) {
                            var sameClass = unitTs.filter(function (t) {
                                return t["class"] === unitT["class"];
                            });
                            if (sameClass.length > 1) return {
                                    v: "" + sameClass.length + " transformers for class " + unitT["class"].name
                                };
                        }
                        if (unitT instanceof UnitProtoT) {
                            var sameProto = unitTs.filter(function (t) {
                                return t.proto === unitT.proto;
                            });
                            if (sameProto.length > 1) return {
                                    v: "" + sameProto.length + " transformers for proto " + unitT.token
                                };
                        }
                    })(i);

                    if (typeof _ret === "object") {
                        return _ret.v;
                    }
                }
            }
        }
    });

    return CompositeT;
})();