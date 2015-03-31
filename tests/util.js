import {assert} from 'chai'
import {inspect} from 'util'
import {applyMethod, cloneDeep, isPlainObject} from '../dist/util'


describe('util', () => {

    describe('applyMethod()', () => {

        let obj = {
            foo: 3,
            test: function (...args) { return [this.foo].concat(args) }
        }

        it('applies a method of an object with given arguments', () => {
            assert.deepEqual([3],                   applyMethod(obj, 'test', []))
            assert.deepEqual([3, 14, 15],           applyMethod(obj, 'test', [14, 15]))
            assert.deepEqual([3, 14, 15, 92, 6, 5], applyMethod(obj, 'test', [14, 15, 92, 6, 5]))
        })

        it('calls a method without arguments when no args provided', () => {
            assert.deepEqual([3], applyMethod(obj, 'test'))
        })

    })

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

})