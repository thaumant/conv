const CompositeT = require('./CompositeT')


let specs = [
    {token: 'Date', class: Date},
    {token: 'RegExp', class: RegExp, dump: (r) => r.source}
]

if (typeof Buffer === 'function')
    specs.push({
        token: 'Buffer',
        class: Buffer,
        dump: (b) => b.toString('base64'),
        restore: (s) => new Buffer(s, 'base64')
    })

if (typeof Map === 'function')
    specs.push({
        token: 'Map',
        class: Map,
        dump: (m) => {
            let pairs = []
            m.forEach((val, key) => pairs.push([key, val]))
            return pairs
        },
        restore: (pairs) => {
            let m = new Map()
            for (let i in pairs) m.set(pairs[i][0], pairs[i][1])
            return m
        }
    })

if (typeof Set === 'function') {
    specs.push({
        token: 'Set',
        class: Set,
        dump: (s) => {
            let arr = []
            s.forEach((val) => arr.push(val))
            return arr
        },
        restore: (arr) => {
            let s = new Set()
            for (let i in arr) s.add(arr[i])
            return s
        }
    })
}

const stdT = new CompositeT(specs)


stdT.shaped = stdT
stdT.CompositeT = CompositeT


module.exports = stdT
