"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var UnitConv = require("./UnitConv");
var _require = require("./util");

var getProtoChain = _require.getProtoChain;
var isFunc = _require.isFunc;
var isStr = _require.isStr;
var getFunctionName = _require.getFunctionName;

module.exports = (function (_UnitConv) {
    function UnitClassConv(spec) {
        _classCallCheck(this, UnitClassConv);

        var err = this.validateSpec(spec);
        if (err) throw new Error("Failed to create class converter: " + err);

        this["class"] = spec["class"];
        this.token = spec.token || getFunctionName(spec["class"]);
        this.restore = spec.restore || function (dumped) {
            return new spec["class"](dumped);
        };
        this.namespace = spec.namespace;
        this.path = (this.namespace ? this.namespace + "." : "") + this.token;
        this.protoChain = getProtoChain(this["class"].prototype, true);

        var dump = spec.dump;
        switch (true) {
            case isFunc(dump):
                this.dump = dump;break;
            case isStr(dump):
                this.dump = function (val) {
                    return val[dump]();
                };break;
            default:
                this.dump = function (val) {
                    return val.toJSON();
                };
        }
    }

    _inherits(UnitClassConv, _UnitConv);

    _createClass(UnitClassConv, {
        validateSpec: {
            value: function validateSpec(s) {
                if (s instanceof UnitClassConv) {
                    return;
                }var err = _get(Object.getPrototypeOf(UnitClassConv.prototype), "validateSpec", this).call(this, s);
                if (err) {
                    return err;
                }var maybeToken = this.isValidName(s.token) && s.token || getFunctionName(s["class"]),
                    forToken = maybeToken ? " for " + maybeToken : "";

                switch (true) {
                    case !maybeToken:
                        return "missing token and no class name";
                    case s.token == null:
                        break;
                    case this.isValidName(s.token):
                        break;
                    default:
                        return "invalid token" + forToken;
                }
                switch (true) {
                    case s.namespace == null:
                        break;
                    case this.isValidNS(s.namespace):
                        break;
                    default:
                        return "invalid namespace" + forToken;
                }
                switch (true) {
                    case isFunc(s["class"]):
                        break;
                    default:
                        return "invalid class" + forToken;
                }
                switch (true) {
                    case s.restore == null:
                        break;
                    case isFunc(s.restore):
                        break;
                    default:
                        return "invalid restore method" + forToken;
                }
                switch (true) {
                    case isFunc(s["class"].prototype.toJSON) && s.dump == null:
                        break;
                    case s.dump == null:
                        return "missing dump method" + forToken;
                    case isFunc(s.dump):
                        break;
                    case isStr(s.dump):
                        break;
                    default:
                        return "invalid dump method" + forToken;
                }
            }
        }
    });

    return UnitClassConv;
})(UnitConv);