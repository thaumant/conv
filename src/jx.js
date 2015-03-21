const Transformer = require('./Transformer')


let specs = [
    {class: Date},
    {class: RegExp, encode: (r) => r.source}
]

if (typeof Buffer === 'function')
    specs.push({
        class: Buffer,
        encode: (b) => b.toString('base64'),
        decode: (s) => new Buffer(s, 'base64')
    })

if (typeof Map === 'function')
    specs.push({
        class: Map,
        encode: (m) => {
            let pairs = []
            m.forEach((val, key) => pairs.push([key, val]))
            return pairs
        },
        decode: (pairs) => {
            let m = new Map()
            for (i in pairs) m.set(pairs[i][0], pairs[i][1])
            return m
        }
    })

if (typeof Set === 'function') {
    specs.push({
        class: Set,
        encode: (s) => {
            let arr = []
            s.forEach((val) => arr.push(val))
            return arr
        },
        decode: (arr) => {
            let s = new Set()
            for (i in arr) s.add(arr[i])
            return s
        }
    })
}

const stdT = new Transformer(specs)


stdT.jx = stdT
stdT.Transformer = Transformer


module.exports = stdT
