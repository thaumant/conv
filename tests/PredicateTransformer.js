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

        it('tells if namespace is given and it is not a non-empty string', () => {
            assert.strictEqual('invalid namespace for Foo', val({pred: isFoo, token: 'Foo', namespace: 2}))
            assert.strictEqual('invalid namespace for Foo', val({pred: isFoo, token: 'Foo', namespace: {}}))
        })

    })


    describe('#constructor()', () => {

        let s1 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec, namespace: 'foobar'},
            s2 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec, namespace: 0},
            t1 = new PredicateTransformer(s1),
            t2 = new PredicateTransformer(s2)

        it('validates spec with #validateSpec(), throwing it\'s messages as errors', () => {
            let test1 = () => new PredicateTransformer({pred: isFoo}),
                test2 = () => new PredicateTransformer({token: 'Foo', pred: isFoo})
            assert.throw(test1, 'Failed to create predicate transformer: missing token')
            assert.throw(test2, 'Failed to create predicate transformer: missing encoder for Foo')
        })

        it('stores spec.token as token property', () => {
            assert.strictEqual(s1.token, t1.token)
        })

        it('stores spec.pred as pred method', () => {
            assert.strictEqual(s1.pred, t1.pred)
        })

        it('stores spec.encode as encode method', () => {
            assert.strictEqual(s1.encode, t1.encode)
        })

        it('stores spec.decode as decode method', () => {
            assert.strictEqual(s1.decode, t1.decode)
        })

        it('stores spec.namespace as namespace property, or sets to null if falsy', () => {
            
            assert.strictEqual(t1.namespace, s1.namespace)
            assert.strictEqual(t2.namespace, null)
        })

        it('sets path property as `namespace.token` or just `token`', () => {
            assert.strictEqual(t1.path, s1.namespace + '.' + s1.token)
            assert.strictEqual(t2.path, s2.token)
        })

    })
})