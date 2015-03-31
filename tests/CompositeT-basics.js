import {assert} from 'chai'
import {inspect} from 'util'
import CompositeT from '../dist/CompositeT'
import UnitPredT from '../dist/UnitPredT'
import UnitClassT from '../dist/UnitClassT'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, barDump} from './aux'


describe('CompositeT (basics)', () => {

    describe('#makeUnitT()', () => {

        let make = CompositeT.prototype.makeUnitT

        it('accepts spec and returns correspondent UnitT', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest}
            assert.instanceOf(make(spec1), UnitClassT)
            assert.instanceOf(make(spec2), UnitPredT)
        })

        it('accepts instance of UnitT and returns it unmodified', () => {
            let t = new UnitClassT({class: Bar})
            assert.strictEqual(t, make(t))
        })

        it('throws an error if cannot determine which transformer to create', () => {
            assert.throws(() => make({}), 'Invalid spec, no class or predicate')
        })

    })

    describe('#validateConsistency()', () => {

        let make = CompositeT.prototype.makeUnitT,
            val  = CompositeT.prototype.validateConsistency

        it('tells if there are more than one transformer with the same token', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Foo', class: Bar, dump: barDump},
                ts = [spec1, spec2].map(make)
            assert.strictEqual('2 transformers for token Foo', val(ts))
        })

        it('tells if some class occurs more than one time', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Bar', class: Foo, dump: fooDump},
                ts = [spec1, spec2].map(make)
            assert.strictEqual('2 transformers for class Foo', val(ts))
        })

        it('passes valid array of transformers', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Bar', class: Bar, dump: barDump},
                ts = [spec1, spec2].map(make)
            assert.strictEqual(undefined, val(ts))
        })

        it('passes if there are transformers with the same token but different namespaces', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump, namespace: 'foobar'},
                spec2 = {token: 'Foo', class: Bar, dump: barDump, namespace: 'bazqux'},
                ts = [spec1, spec2].map(make)
        })

    })

    describe('#constructor()', () => {

        it('stores prefix and serializer options if provided', () => {
            let t = new CompositeT([], {prefix: 'foo', serializer: isFoo})
            assert.strictEqual('foo', t.options.prefix)
            assert.strictEqual(isFoo, t.options.serializer)
        })

        it('throws an error if specs is not an array', () => {
            let test1 = () => new CompositeT(3),
                test2 = () => new CompositeT({})
            assert.throw(test1, 'Expected array of specs')
            assert.throw(test2, 'Expected array of specs')
        })

        it('throws if some spec is not valid', () => {
            let test = () => new CompositeT([{pred: isFoo}])
            assert.throw(test, 'Failed to create predicate transformer: missing token')
        })

        it('performs #validateConsistency() on transformers made of specs', () => {
            let spec1 = {class: Bar},
                spec2 = {class: Bar},
                test = () => new CompositeT([spec1, spec2])
            assert.throw(test, 'Inconsistent transformers: 2 transformers for token Bar')
        })

        it('creates array of UnitT instances from array of valid specs', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest},
                t = new CompositeT([spec1, spec2])
            assert.lengthOf(t.unitTs, 2)
            assert.instanceOf(t.unitTs[0], UnitClassT)
            assert.instanceOf(t.unitTs[1], UnitPredT)
        })

    })

})
