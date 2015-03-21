import {assert} from 'chai'
import {inspect} from 'util'
import UnitTransformer from '../dist/UnitTransformer'
import {Foo, fooSpec1} from './aux'

describe('UnitTransformer', () => {

    describe('#validateSpec()', () => {

        let val = UnitTransformer.prototype.validateSpec

        it('tells if spec is not a plain object', () => {
            assert.strictEqual('spec is not a plain object', val(null))
            assert.strictEqual('spec is not a plain object', val(2))
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if spec has neigher class nor predicate', () => {
            assert.strictEqual('spec is missing class or predicate', val({}))
        })

        it('passes otherwise', () => {
            assert.strictEqual(undefined, val({class: 3}))
        })

    })

    describe('#isValidName()', () => {

        let val = UnitTransformer.prototype.isValidName

        it('returns false when given invalid name for js variable', () => {
            assert.strictEqual(false, val('1'))
            assert.strictEqual(false, val('1foo'))
            assert.strictEqual(false, val('foo-bar'))
            assert.strictEqual(false, val('foo.bar'))
            assert.strictEqual(false, val('foo/bar'))
        })

        it('returns true when given valid name for js variable', () => {
            assert.strictEqual(true, val('$'))
            assert.strictEqual(true, val('_'))
            assert.strictEqual(true, val('foo1'))
            assert.strictEqual(true, val('foo_$2'))
        })

    })

    describe('#isValidNamespace', () => {

        let val = UnitTransformer.prototype.isValidNamespace.bind(UnitTransformer.prototype)

        it('returns false when given a non-string', () => {
            assert.strictEqual(false, val())
            assert.strictEqual(false, val(2))
            assert.strictEqual(false, val({}))
        })

        it('returns true when given a string of valid js names delimited by dot', () => {
            assert.strictEqual(true, val('$._'))
            assert.strictEqual(true, val('foo1.foo_$2'))
        })

        it('returns false otherwise', () => {
            assert.strictEqual(false, val(''))
            assert.strictEqual(false, val('2'))
            assert.strictEqual(false, val('2.foo'))
            assert.strictEqual(false, val('foo.bar/baz'))
        })

    })

})