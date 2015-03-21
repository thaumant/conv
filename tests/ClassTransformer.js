import {assert} from 'chai'
import {inspect} from 'util'
import ClassTransformer from '../dist/ClassTransformer'
import {Foo, fooDec, fooEnc, Bar, barDec, barEnc} from './aux'

describe('ClassTransformer', () => {

    describe('#validateSpec()', () => {

        let val = ClassTransformer.prototype.validateSpec.bind(ClassTransformer.prototype)

        it('calls UnitTransformer#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
            assert.strictEqual('spec is missing class or predicate', val({}))
        })

        it('tells if token is given and it is not a valid string', () => {
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: 2}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: {}}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: '$%^'}))
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

        it('tells if namespace is given and it is not a non-empty string', () => {
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: 2}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: {}}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: '$%^'}))
        })

    })

    
    describe('#constructor()', () => {

        it('performs #validateSpec()', () => {
            let test1 = () => new ClassTransformer({class: Foo, token: 2}),
                test2 = () => new ClassTransformer({token: 'Foo', class: Foo, decode: fooDec})
            assert.throw(test1, 'Failed to create class transformer: invalid token for Foo')
            assert.throw(test2, 'Failed to create class transformer: missing encoder for Foo')
        })

        it('stores spec.class as spec property', () => {
            let t = new ClassTransformer({class: Bar})
            assert.strictEqual(Bar, t.class)
        })

        it('stores spec.token if given, otherwise make token from class name', () => {
            let t1 = new ClassTransformer({class: Bar, token: 'Baz'}),
                t2 = new ClassTransformer({class: Bar})
            assert.strictEqual('Baz', t1.token)
            assert.strictEqual('Bar', t2.token)
        })

        it('stores decoder if given, otherwise make decoder that calls class constructor', () => {
            let t1 = new ClassTransformer({class: Bar, decode: barDec}),
                t2 = new ClassTransformer({class: Bar}),
                decoded = t2.decode(3)
            assert.strictEqual(barDec, t1.decode)
            assert.instanceOf(decoded, Bar)
            assert.strictEqual(3, decoded.arg1)
            assert.strictEqual(undefined, decoded.arg2)
        })

        it('stores encoder as is if function given', () => {
            let t = new ClassTransformer({class: Bar, encode: barEnc})
            assert.strictEqual(barEnc, t.encode)
        })

        it('makes encoder that calls specified method if spec.encoder is string', () => {
            let t = new ClassTransformer({class: Bar, encode: 'bar'})
            assert.strictEqual(24, t.encode(new Bar))
        })

        it('uses #toJSON() if exists and no encoder given', () => {
            let t = new ClassTransformer({class: Bar})
            assert.strictEqual(42, t.encode(new Bar))
        })

        it('stores spec.namespace as namespace property, or sets to null if falsy', () => {
            let t1 = new ClassTransformer({class: Bar, namespace: 'foobar'}),
                t2 = new ClassTransformer({class: Bar})
            assert.strictEqual('foobar', t1.namespace)
            assert.strictEqual(null, t2.namespace)
        })

        it('sets path property as `namespace.token` or just `token`', () => {
            let t1 = new ClassTransformer({class: Bar, namespace: 'foobar'}),
                t2 = new ClassTransformer({class: Bar})
            assert.strictEqual(t1.path, 'foobar.Bar')
            assert.strictEqual(t2.path, 'Bar')
        })

    })

})