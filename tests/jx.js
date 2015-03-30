import jx from '../dist/jx'
import {assert} from 'chai'
import {inspect} from 'util'

let testBuffer = typeof Buffer !== 'function',
    testMap = typeof Map !== 'function' || !Map.prototype.forEach,
    testSet = typeof Set !== 'function' || !Set.prototype.forEach

describe('jx', () => {

    it('does not modify scalar values', () => {
        assert.strictEqual(3, jx.restore(3))
        assert.strictEqual(3, jx.dump(3))
        assert.strictEqual('foo', jx.restore('foo'))
        assert.strictEqual('foo', jx.dump('foo'))
    })

    it('dumps and restores Date', () => {
        let date = new Date,
            dumped = date.toJSON(),
            restored = jx.restore({$Date: dumped})
        assert.deepEqual({$Date: dumped}, jx.dump(date))
        assert.instanceOf(restored, Date)
        assert.strictEqual(date.toString(), restored.toString())
    })

    it('dumps and restores Buffer if presented', testBuffer ? undefined : () => {
        let buffer = new Buffer([3, 14, 15, 92, 6]),
            dumped = buffer.toString('base64'),
            restored = jx.restore({$Buffer: dumped})
        assert.deepEqual({$Buffer: dumped}, jx.dump(buffer))
        assert.instanceOf(restored, Buffer)
        assert.strictEqual(buffer.inspect(), restored.inspect())
    })

    it('dumps and restores Map if presented', testMap ? undefined : () => {
        let map = new Map()
        map.set(3, 'foo')
        map.set('bar', 'baz')
        let dumped = []
        map.forEach((val, key) => dumped.push([key, val]))
        let restored = jx.restore({$Map: dumped})
        assert.deepEqual({$Map: dumped}, jx.dump(map))
        assert.instanceOf(restored, Map)
        assert.strictEqual(2, restored.size)
        assert.strictEqual('foo', restored.get(3))
        assert.strictEqual('baz', restored.get('bar'))
    })

    it('dumps and restores Set if presented', testSet ? undefined : () => {
        let set = new Set()
        set.add(3)
        set.add('foo')
        let dumped = [3, 'foo'],
            restored = jx.restore({$Set: dumped})
        assert.deepEqual({$Set: dumped}, jx.dump(set))
        assert.instanceOf(restored, Set)
        assert.strictEqual(2, restored.size)
        assert(true, restored.has(3))
        assert(true, restored.has('foo'))
    })

})