"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var UnitConv = require("./UnitConv");
var _require = require("./util");

var isFunc = _require.isFunc;
var isStr = _require.isStr;

module.exports = (function (_UnitConv) {
    function UnitPredConv(spec) {
        _classCallCheck(this, UnitPredConv);

        var err = this.validateSpec(spec);
        if (err) throw new Error("Failed to create predicate converter: " + err);
        this.token = spec.token;
        this.pred = spec.pred;
        this.dump = spec.dump;
        this.restore = spec.restore;
        this.namespace = spec.namespace;
        this.path = (this.namespace ? this.namespace + "." : "") + this.token;
    }

    _inherits(UnitPredConv, _UnitConv);

    _createClass(UnitPredConv, {
        validateSpec: {
            value: function validateSpec(s) {
                if (s instanceof UnitPredConv) {
                    return;
                }var err = _get(Object.getPrototypeOf(UnitPredConv.prototype), "validateSpec", this).call(this, s);
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
                if (!isFunc(s.pred)) {
                    return "invalid predicate for " + s.token;
                }if (!isFunc(s.dump)) {
                    return "missing dump method for " + s.token;
                }if (!isFunc(s.restore)) {
                    return "missing restore method for " + s.token;
                }
            }
        }
    });

    return UnitPredConv;
})(UnitConv);