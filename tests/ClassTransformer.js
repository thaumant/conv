import {assert} from 'chai'
import {inspect} from 'util'
import ClassTransformer from '../dist/ClassTransformer'
import {Foo, fooDec, Bar, barDec, barEnc} from './aux'

describe('ClassTransformer', () => {

    describe('#validateSpec()', () => {

        let val = ClassTransformer.prototype.validateSpec

        it('calls UnitTransformer#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
            assert.strictEqual('spec is missing class or predicate', val({}))
        })

        it('tells if token is given and it is not a string', () => {
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: 2}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: {}}))
        })

        it('tells if class is not a function with name property', () => {
            assert.strictEqual('invalid class for Foo', val({token: 'Foo', class: 2}))
            assert.strictEqual('invalid class for Foo', val({token: 'Foo', class: () => null}))
        })

        it('tells if decoder is given and it is not a function', () => {
            assert.strictEqual('invalid decoder for Foo', val({token: 'Foo', class: Foo, decode: 2}))
        })

        it('tells if encoder is given and it is not a function or string', () => {
            assert.strictEqual('invalid encoder for Foo', val({token: 'Foo', class: Foo, decode: fooDec, encode: 2}))
            assert.strictEqual('invalid encoder for Foo', val({token: 'Foo', class: Foo, decode: fooDec, encode: {}}))
        })

        it('tells if encoder is missing and class has no #toJSON() method', () => {
            assert.strictEqual('missing encoder for Foo', val({token: 'Foo', class: Foo, decode: fooDec}))
        })

        it('passes if no encoder given but clas has #toJSON() method', () => {
            assert.strictEqual(undefined, val({class: Bar, decode: barDec}))
        })

        it('passes if falsy decoder or token given', () => {
            assert.strictEqual(undefined, val({class: Bar, encode: barEnc}))
        })

        it('needs only class param if class has #toJSON() method', () => {
            assert.strictEqual(undefined, val({class: Bar}))
        })

    })

})