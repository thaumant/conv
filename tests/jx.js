import jx from '../dist/jx'
import {assert} from 'chai'
import {inspect} from 'util'


describe('jx', () => {

    it('does not modify scalar values', () => {
        assert.strictEqual(3, jx.decode(3))
        assert.strictEqual(3, jx.encode(3))
        assert.strictEqual('foo', jx.decode('foo'))
        assert.strictEqual('foo', jx.encode('foo'))
    })

    it('encodes and decodes Date', () => {
        let date = new Date,
            encoded = date.toJSON(),
            decoded = jx.decode({$Date: encoded})
        assert.deepEqual({$Date: encoded}, jx.encode(date))
        assert.instanceOf(decoded, Date)
        assert.strictEqual(date.toString(), decoded.toString())
    })

    it('encodes and decodes Buffer if presented', typeof Buffer !== 'function' ? undefined : () => {
        let buffer = new Buffer([3, 14, 15, 92, 6]),
            encoded = buffer.toString('base64'),
            decoded = jx.decode({$Buffer: encoded})
        assert.deepEqual({$Buffer: encoded}, jx.encode(buffer))
        assert.instanceOf(decoded, Buffer)
        assert.strictEqual(buffer.inspect(), decoded.inspect())
    })

    it('encodes and decodes Map if presented', typeof Map !== 'function' || !Map.prototype.forEach ? undefined : () => {
        let map = new Map()
        map.set(3, 'foo')
        map.set('bar', 'baz')
        let encoded = []
        map.forEach((val, key) => encoded.push([key, val]))
        let decoded = jx.decode({$Map: encoded})
        assert.deepEqual({$Map: encoded}, jx.encode(map))
        assert.instanceOf(decoded, Map)
        assert.strictEqual(2, decoded.size)
        assert.strictEqual('foo', decoded.get(3))
        assert.strictEqual('baz', decoded.get('bar'))
    })

    it('encodes and decodes Set if presented', typeof Set !== 'function' || !Set.prototype.forEach ? undefined : () => {
        let set = new Set()
        set.add(3)
        set.add('foo')
        let encoded = [3, 'foo'],
            decoded = jx.decode({$Set: encoded})
        assert.deepEqual({$Set: encoded}, jx.encode(set))
        assert.instanceOf(decoded, Set)
        assert.strictEqual(2, decoded.size)
        assert(true, decoded.has(3))
        assert(true, decoded.has('foo'))
    })

})