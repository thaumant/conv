import {assert} from 'chai'
import {cloneDeep, isPlainObject, getProtoChain, getFunctionName} from '../dist/util'


describe('util', () => {

    describe('cloneDeep()', () => {

        it('does not modify scalar values', () => {
            assert.strictEqual(undefined, cloneDeep(undefined))
            assert.strictEqual(null,      cloneDeep(null))
            assert.strictEqual(3,         cloneDeep(3))
            assert.strictEqual('foo',     cloneDeep('foo'))
        })

        it('clones arrays', () => {
            let orig = [3, 14, 15],
                copy = cloneDeep(orig)
            assert.notEqual(orig, copy)
            assert.deepEqual(orig, copy)
        })

        it('clones objects', () => {
            let orig = {foo: 3, bar: 14},
                copy = cloneDeep(orig)
            assert.notEqual(orig, copy)
            assert.deepEqual(orig, copy)
        })

        it('clones nested structures', () => {
            let orig = {foo: [3, 14]},
                copy = cloneDeep(orig)
            assert.notEqual(orig, copy)
            assert.notEqual(orig.foo, copy.foo)
            assert.deepEqual(orig, copy)
        })

        it('decomposes class instances to plain objects', () => {
            class Foo {
                constructor() { this.bar = 3 }
                foo() {}
            }
            let orig = new Foo,
                copy = cloneDeep(orig)
            assert.notEqual(orig, copy)
            assert.notInstanceOf(copy, Foo)
            assert.deepEqual({bar: 3}, copy)
        })

    })

    describe('isPlainObject()', () => {

        it('returns false for scalar values', () => {
            assert.strictEqual(false, isPlainObject(undefined))
            assert.strictEqual(false, isPlainObject(null))
            assert.strictEqual(false, isPlainObject('foo'))
            assert.strictEqual(false, isPlainObject(3))
        })

        it('returns false for arrays, functions and standard js objects', () => {
            assert.strictEqual(false, isPlainObject([]))
            assert.strictEqual(false, isPlainObject(() => {}))
            assert.strictEqual(false, isPlainObject(new Date))
            assert.strictEqual(false, isPlainObject(/foo/))
        })

        it('returns false for objects made with constructors', () => {
            function Foo() {}
            class Bar {}
            assert.strictEqual(false, isPlainObject(new Foo))
            assert.strictEqual(false, isPlainObject(new Bar))
        })

        it('returns true for plain objects', () => {
            assert.strictEqual(true, isPlainObject({foo: 3}))
            assert.strictEqual(true, isPlainObject(Object.create(null)))
        })

    })

    describe('getProtoChain()', () => {

        let get = getProtoChain

        it('returns chain with a single proto for plain object', () => {
            let chain = get({})
            assert.lengthOf(chain, 1)
            assert.strictEqual(Object.prototype, chain[0])
        })

        it('returns empty chains for scalars and functions', () => {
            assert.lengthOf(get(undefined),   0)
            assert.lengthOf(get(null),        0)
            assert.lengthOf(get(3),           0)
            assert.lengthOf(get('foo'),       0)
            assert.lengthOf(get(() => {}),    0)
        })

        it('returns proper chains for dates and regexes', () => {
            ([/foo/, new Date]).forEach((val) => {
                let chain = get(val)
                assert.lengthOf(chain, 2)
                assert.strictEqual(chain[0], val.constructor.prototype)
                assert.strictEqual(chain[1], Object.prototype)
            })
        })

        it('returns proper chains for sublasses instances', () => {
            class Foo {}
            class Bar extends Foo {}
            let chain = get(new Bar)
            assert.lengthOf(chain, 3)
            assert.strictEqual(chain[0], Bar.prototype)
            assert.strictEqual(chain[1], Foo.prototype)
            assert.strictEqual(chain[2], Object.prototype)
        })

        it('includes value itself when inclusive arg is true', () => {
            let date = new Date,
                nullChain = get(null, true),
                dateChain = get(date, true)
            assert.lengthOf(nullChain, 1)
            assert.lengthOf(dateChain, 3)
            assert.strictEqual(null, nullChain[0])
            assert.strictEqual(date, dateChain[0])
            assert.strictEqual(Date.prototype,   dateChain[1])
            assert.strictEqual(Object.prototype, dateChain[2])
        })

    })

    describe('getFunctionName()', () => {

        it('returns a name of named function or class', () => {
            function foo() {}
            class Bar {}
            assert.strictEqual('foo', getFunctionName(foo))
            assert.strictEqual('Bar', getFunctionName(Bar))
        })

        it('returns null for anonymous functions', () => {
            assert.strictEqual(null, getFunctionName(() => {}))
        })

        it('returns null for any value other than function', () => {
            assert.strictEqual(null, getFunctionName(undefined))
            assert.strictEqual(null, getFunctionName(null))
            assert.strictEqual(null, getFunctionName(3))
            assert.strictEqual(null, getFunctionName('foo'))
            assert.strictEqual(null, getFunctionName({}))
        })

    })

})