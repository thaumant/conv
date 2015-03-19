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

})