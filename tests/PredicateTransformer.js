import {assert} from 'chai'
import {inspect} from 'util'
import PredicateTransformer from '../dist/PredicateTransformer'
import {isFoo, fooDec, fooEnc} from './aux'

describe('PredicateTransformer', () => {

    describe('#validateSpec()', () => {

        let val = PredicateTransformer.prototype.validateSpec

        it('calls UnitTransformer#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
            assert.strictEqual('spec is missing class or predicate', val({}))
        })

        it('tells if token is not a non-empty string', () => {
            assert.strictEqual('missing token', val({pred: isFoo}))
            assert.strictEqual('invalid token', val({pred: isFoo, token: 2}))
            assert.strictEqual('invalid token', val({pred: isFoo, token: {}}))
        })

        it('tells if predicate is not a function', () => {
            assert.strictEqual('invalid predicate for Foo', val({token: 'Foo', pred: 2}))
            assert.strictEqual('invalid predicate for Foo', val({token: 'Foo', pred: {}}))
        })

        it('tells if encoder is not a function', () => {
            assert.strictEqual('missing encoder for Foo', val({token: 'Foo', pred: isFoo}))
            assert.strictEqual('missing encoder for Foo', val({token: 'Foo', pred: isFoo, encode: 2}))
        })

        it('tells if decoder is not a function', () => {
            assert.strictEqual('missing decoder for Foo', val({token: 'Foo', pred: isFoo, encode: fooEnc}))
            assert.strictEqual('missing decoder for Foo', val({token: 'Foo', pred: isFoo, encode: fooEnc, decode: {}}))
        })

    })


    describe('#constructor()', () => {

        let s = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec},
            t = new PredicateTransformer(s)

        it('stores spec.token as token property', () => {
            assert.strictEqual(s.token, t.token)
        })

        it('stores spec.pred as pred method', () => {
            assert.strictEqual(s.pred, t.pred)
        })

        it('stores spec.encode as encode method', () => {
            assert.strictEqual(s.encode, t.encode)
        })

        it('stores spec.decode as decode method', () => {
            assert.strictEqual(s.decode, t.decode)
        })

    })
})