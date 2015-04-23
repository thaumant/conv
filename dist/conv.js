"use strict";

var CompositeConv = require("./CompositeConv");

var specs = [{
    token: "Infinity",
    pred: function (x) {
        return x === Infinity || x === -Infinity;
    },
    dump: function (x) {
        return x === Infinity ? 1 : -1;
    },
    restore: function (x) {
        return x === 1 ? Infinity : -Infinity;
    }
}, {
    token: "Date",
    "class": Date
}, {
    token: "RegExp",
    "class": RegExp,
    dump: function (r) {
        return r.source;
    }
}];

if (typeof Buffer === "function") specs.push({
    token: "Buffer",
    "class": Buffer,
    dump: function (b) {
        return b.toString("base64");
    },
    restore: function (s) {
        return new Buffer(s, "base64");
    }
});

if (typeof Map === "function") specs.push({
    token: "Map",
    "class": Map,
    dump: function (m) {
        var pairs = [];
        m.forEach(function (val, key) {
            return pairs.push([key, val]);
        });
        return pairs;
    },
    restore: function (pairs) {
        var m = new Map();
        for (var i in pairs) {
            m.set(pairs[i][0], pairs[i][1]);
        }return m;
    }
});

if (typeof Set === "function") {
    specs.push({
        token: "Set",
        "class": Set,
        dump: function (s) {
            var arr = [];
            s.forEach(function (val) {
                return arr.push(val);
            });
            return arr;
        },
        restore: function (arr) {
            var s = new Set();
            for (var i in arr) {
                s.add(arr[i]);
            }return s;
        }
    });
}

var stdConv = new CompositeConv(specs);

stdConv.conv = stdConv;
stdConv.CompositeConv = CompositeConv;

module.exports = stdConv;