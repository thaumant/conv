const CompositeT = require('./CompositeT')


let specs = [
    {token: 'Date', class: Date},
    {token: 'RegExp', class: RegExp, encode: (r) => r.source}
]

if (typeof Buffer === 'function')
    specs.push({
        token: 'Buffer',
        class: Buffer,
        encode: (b) => b.toString('base64'),
        decode: (s) => new Buffer(s, 'base64')
    })

if (typeof Map === 'function')
    specs.push({
        token: 'Map',
        class: Map,
        encode: (m) => {
            let pairs = []
            m.forEach((val, key) => pairs.push([key, val]))
            return pairs
        },
        decode: (pairs) => {
            let m = new Map()
            for (let i in pairs) m.set(pairs[i][0], pairs[i][1])
            return m
        }
    })

if (typeof Set === 'function') {
    specs.push({
        token: 'Set',
        class: Set,
        encode: (s) => {
            let arr = []
            s.forEach((val) => arr.push(val))
            return arr
        },
        decode: (arr) => {
            let s = new Set()
            for (let i in arr) s.add(arr[i])
            return s
        }
    })
}

const stdT = new CompositeT(specs)


stdT.jx = stdT
stdT.CompositeT = CompositeT


module.exports = stdT
