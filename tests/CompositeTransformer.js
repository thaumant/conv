import {assert} from 'chai'
import {inspect} from 'util'
import CompositeTransformer from '../dist/CompositeTransformer'
import PredicateTransformer from '../dist/PredicateTransformer'
import ClassTransformer from '../dist/ClassTransformer'
import {Foo, isFoo, fooEnc, fooDec, Bar, barEnc} from './aux'


describe('CompositeTransformer', () => {

    describe('#makeUnitTransformer()', () => {

        let make = CompositeTransformer.prototype.makeUnitTransformer

        it('accepts spec and returns correspondent UnitTransformer', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec}
            assert.instanceOf(make(spec1), ClassTransformer)
            assert.instanceOf(make(spec2), PredicateTransformer)
        })

        it('throws an error if cannot determine which transformer to create', () => {
            assert.throws(() => make({}), 'Invalid spec, no class or predicate')
        })

    })

    describe('#validateConsistency()', () => {

        let make = CompositeTransformer.prototype.makeUnitTransformer,
            val  = CompositeTransformer.prototype.validateConsistency

        it('tells if there are more than one transformer with the same token', () => {
            let spec1 = {token: 'Foo', class: Foo, encode: fooEnc},
                spec2 = {token: 'Foo', class: Bar, encode: barEnc},
                ts = [spec1, spec2].map(make)
            assert.strictEqual('2 transformers for token Foo', val(ts))
        })

        it('tells if some class occurs more than one time', () => {
            let spec1 = {token: 'Foo', class: Foo, encode: fooEnc},
                spec2 = {token: 'Bar', class: Foo, encode: fooEnc},
                ts = [spec1, spec2].map(make)
            assert.strictEqual('2 transformers for class Foo', val(ts))
        })

        it('passes valid array of transformers', () => {
            let spec1 = {token: 'Foo', class: Foo, encode: fooEnc},
                spec2 = {token: 'Bar', class: Bar, encode: barEnc},
                ts = [spec1, spec2].map(make)
            assert.strictEqual(undefined, val(ts))
        })

    })

    describe('#constructor()', () => {

        it('stores prefix and serializer options if provided', () => {
            let t = new CompositeTransformer([], {prefix: 'foo', serializer: isFoo})
            assert.strictEqual('foo', t.options.prefix)
            assert.strictEqual(isFoo, t.options.serializer)
        })

        it('throws an error if specs is not an array', () => {
            let test1 = () => new CompositeTransformer(3),
                test2 = () => new CompositeTransformer({})
            assert.throw(test1, 'Expected array of specs')
            assert.throw(test2, 'Expected array of specs')
        })

        it('throws if some spec is not valid', () => {
            let test = () => new CompositeTransformer([{pred: isFoo}])
            assert.throw(test, 'Failed to create predicate transformer: missing token')
        })

        it('performs #validateConsistency() on transformers made of specs', () => {
            let spec1 = {class: Bar},
                spec2 = {class: Bar},
                test = () => new CompositeTransformer([spec1, spec2])
            assert.throw(test, 'Inconsistent transformers: 2 transformers for token Bar')
        })

        it('creates array of UnitTransformer instances from array of valid specs', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec},
                t = new CompositeTransformer([spec1, spec2])
            assert.lengthOf(t.transformers, 2)
            assert.instanceOf(t.transformers[0], ClassTransformer)
            assert.instanceOf(t.transformers[1], PredicateTransformer)
        })

    })

})