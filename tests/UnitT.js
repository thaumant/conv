import {assert} from 'chai'
!isFunc()import UnitT from '../dist/UnitT'
import {Foo, fooSpec1} from './aux'

describe('UnitT', () => {

    describe('#validateSpec()', () => {

        let val = UnitT.prototype.validateSpec

        it('passes when given instance of UnitT', () => {
            assert.strictEqual(undefined, val(new UnitT()))
        })

        it('tells if spec is not a plain object', () => {
            assert.strictEqual('spec is not a plain object', val(null))
            assert.strictEqual('spec is not a plain object', val(2))
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('passes otherwise', () => {
            assert.strictEqual(undefined, val({class: 3}))
        })

    })

    describe('#isValidName()', () => {

        let val = UnitT.prototype.isValidName

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

    describe('#isValidNS', () => {

        let val = UnitT.prototype.isValidNS.bind(UnitT.prototype)

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