"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _require = require("./util");

var isPlainObject = _require.isPlainObject;

module.exports = (function () {
    function UnitConv() {
        _classCallCheck(this, UnitConv);
    }

    _createClass(UnitConv, {
        validateSpec: {
            value: function validateSpec(s) {
                if (s instanceof UnitConv) {
                    return;
                }if (!isPlainObject(s)) {
                    return "spec is not a plain object";
                }
            }
        },
        isValidName: {
            value: function isValidName(str) {
                return typeof str === "string" && /^[a-zA-Z\$_][a-zA-Z\$_\d]*$/i.test(str);
            }
        },
        isValidNS: {
            value: function isValidNS(str) {
                if (typeof str !== "string") {
                    return false;
                }var parts = str.split(".");
                for (var i in parts) {
                    if (!this.isValidName(parts[i])) {
                        return false;
                    }
                }
                return true;
            }
        }
    });

    return UnitConv;
})();