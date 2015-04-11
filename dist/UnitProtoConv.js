"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var UnitConv = require("./UnitConv");
var _require = require("./util");

var getProtoChain = _require.getProtoChain;
var isStr = _require.isStr;
var isFunc = _require.isFunc;

module.exports = (function (_UnitConv) {
    function UnitProtoConv(spec) {
        _classCallCheck(this, UnitProtoConv);

        var err = this.validateSpec(spec);
        if (err) throw new Error("Failed to create proto converter: " + err);

        this.proto = spec.proto;
        this.token = spec.token;
        this.namespace = spec.namespace;
        this.path = (this.namespace ? this.namespace + "." : "") + this.token;
        this.protoChain = getProtoChain(this.proto, true);

        this.restore = spec.restore || this._defaultRestore;

        var dump = spec.dump;
        switch (true) {
            case typeof dump === "function":
                this.dump = dump;break;
            case typeof dump === "string":
                this.dump = function (val) {
                    return val[dump]();
                };break;
            default:
                this.dump = this._defaultDump;
        }
    }

    _inherits(UnitProtoConv, _UnitConv);

    _createClass(UnitProtoConv, {
        validateSpec: {
            value: function validateSpec(s) {
                if (s instanceof UnitProtoConv) {
                    return;
                }var err = _get(Object.getPrototypeOf(UnitProtoConv.prototype), "validateSpec", this).call(this, s);
                if (err) {
                    return err;
                }switch (true) {
                    case s.token == null:
                        return "missing token";
                    case this.isValidName(s.token):
                        break;
                    default:
                        return "invalid token";
                }
                switch (true) {
                    case s.namespace == null:
                        break;
                    case this.isValidNS(s.namespace):
                        break;
                    default:
                        return "invalid namespace for " + s.token;
                }
                switch (true) {
                    case s.proto == null:
                        break;
                    case typeof s.proto === "object":
                        break;
                    case typeof s.proto === "function":
                        break;
                    default:
                        return "invalid proto for " + s.token;
                }
                switch (true) {
                    case s.restore == null:
                        break;
                    case typeof s.restore === "function":
                        break;
                    default:
                        return "invalid restore method for " + s.token;
                }
                switch (true) {
                    case !s.dump:
                        break;
                    case typeof s.dump === "function":
                        break;
                    case typeof s.dump === "string":
                        break;
                    default:
                        return "invalid dump method for " + s.token;
                }
            }
        },
        _defaultDump: {
            value: function _defaultDump(val) {
                var result = {};
                for (var key in val) {
                    if (val.hasOwnProperty(key)) result[key] = val[key];
                }
                return result;
            }
        },
        _defaultRestore: {
            value: function _defaultRestore(dumped) {
                var result = Object.create(this.proto);
                for (var key in dumped) {
                    result[key] = dumped[key];
                }return result;
            }
        }
    });

    return UnitProtoConv;
})(UnitConv);