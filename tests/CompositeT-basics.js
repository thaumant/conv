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
            assert.throws(() => make({}), 'Invalid spec, no class, prototype or predicate')
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

        it('tells if some proto occurs more than one time', () => {
            let proto = {},
                spec1 = {token: 'Foo', proto: proto},
                spec2 = {token: 'Bar', proto: proto},
                ts = [spec1, spec2].map(make)
            assert.strictEqual('2 transformers for proto Foo', val(ts))
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

    describe('#validateSerializer()', () => {

        let val = CompositeT.prototype.validateSerializer,
            ser = () => null,
            par = () => null

        it('tells if serializer is not an object', () => {
            assert.strictEqual('not an object', val(null))
            assert.strictEqual('not an object', val(3))
            assert.strictEqual('not an object', val('foo'))
        })

        it('tells if serialize method is missing or invalid', () => {
            assert.strictEqual('serialize method is not a function', val({parse: par}))
            assert.strictEqual('serialize method is not a function', val({parse: par, serialize: 'foo'}))
        })

        it('tells if parse method is missing or invalid', () => {
            assert.strictEqual('parse method is not a function', val({serialize: ser}))
            assert.strictEqual('parse method is not a function', val({serialize: ser, parse: 'foo'}))
        })

    })

    describe('#_defaultSerializer()', () => {

        let val = CompositeT.prototype.validateSerializer,
            def = CompositeT.prototype._defaultSerializer()

        it('contains JSON #stringify() and #parse() as #serialize() and #parse()', () => {
            assert.strictEqual(JSON.stringify, def.serialize)
            assert.strictEqual(JSON.parse, def.parse)
        })

        it('passes #validateSerializer() check', () => {
            assert.strictEqual(undefined, val(def))
        })

    })

    describe('#constructor()', () => {

        it('stores prefix and serializer options if provided', () => {
            let s = {serialize: () => null, parse: () => null},
                t = new CompositeT([], {prefix: 'foo', serializer: s})
            assert.strictEqual(t.options.prefix, 'foo')
            assert.strictEqual(t.options.serializer, s)
        })

        it('assigns default JSON serializer when not given', () => {
            let t = new CompositeT([])
            assert.strictEqual(JSON.stringify, t.options.serializer.serialize)
            assert.strictEqual(JSON.parse,     t.options.serializer.parse)
        })

        it('validates given serializer using #validateSerializer()', () => {
            let test = () => new CompositeT([], {serializer: 'foo'})
            assert.throw(test, 'Invalid serializer: not an object')
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

        it('sorts class transformers by the length of the prototype chain', () => {
            class Class1 {}
            class Class2 extends Class1 {}
            class Class3 extends Class2 {}
            let t = new CompositeT([
                    {class: Class2, dump: () => null},
                    {class: Class3, dump: () => null},
                    {class: Class1, dump: () => null}
                ])
            assert.lengthOf(t.classTs, 3)
            assert.strictEqual(t.classTs[0].class, Class3)
            assert.strictEqual(t.classTs[1].class, Class2)
            assert.strictEqual(t.classTs[2].class, Class1)
        })

    })

})
