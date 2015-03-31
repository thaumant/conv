import {assert} from 'chai'
import {inspect} from 'util'
import {applyMethod, cloneDeep} from '../dist/util'


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

})