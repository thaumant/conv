import {assert} from 'chai'
import CompositeConv from '../dist/CompositeConv'
import UnitPredConv from '../dist/UnitPredConv'
import UnitClassConv from '../dist/UnitClassConv'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, barDump} from './aux'


describe('CompositeConv (basics)', () => {

    describe('#makeUnitConv()', () => {

        let make = CompositeConv.prototype.makeUnitConv

        it('accepts spec and returns correspondent UnitConv', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest}
            assert.instanceOf(make(spec1), UnitClassConv)
            assert.instanceOf(make(spec2), UnitPredConv)
        })

        it('accepts instance of UnitConv and returns it unmodified', () => {
            let c = new UnitClassConv({class: Bar})
            assert.strictEqual(c, make(c))
        })

        it('throws an error if cannot determine which converter to create', () => {
            assert.throws(() => make({}), 'Invalid spec, no class, prototype or predicate')
        })

    })

    describe('#validateConsistency()', () => {

        let make = CompositeConv.prototype.makeUnitConv,
            val  = CompositeConv.prototype.validateConsistency

        it('tells if there are more than one converter with the same token', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Foo', class: Bar, dump: barDump},
                cs = [spec1, spec2].map(make)
            assert.strictEqual('2 converters for token Foo', val(cs))
        })

        it('tells if some class occurs more than one time', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Bar', class: Foo, dump: fooDump},
                cs = [spec1, spec2].map(make)
            assert.strictEqual('2 converters for class Foo', val(cs))
        })

        it('tells if some proto occurs more than one time', () => {
            let proto = {},
                spec1 = {token: 'Foo', proto: proto},
                spec2 = {token: 'Bar', proto: proto},
                cs = [spec1, spec2].map(make)
            assert.strictEqual('2 converters for proto Foo', val(cs))
        })

        it('passes valid array of converters', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump},
                spec2 = {token: 'Bar', class: Bar, dump: barDump},
                cs = [spec1, spec2].map(make)
            assert.strictEqual(undefined, val(cs))
        })

        it('passes if there are converters with the same token but different namespaces', () => {
            let spec1 = {token: 'Foo', class: Foo, dump: fooDump, namespace: 'foobar'},
                spec2 = {token: 'Foo', class: Bar, dump: barDump, namespace: 'bazqux'},
                cs = [spec1, spec2].map(make)
        })

    })

    describe('#validateSerializer()', () => {

        let val = CompositeConv.prototype.validateSerializer,
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

        let val = CompositeConv.prototype.validateSerializer,
            def = CompositeConv.prototype._defaultSerializer()

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
                с = new CompositeConv([], {prefix: 'foo', serializer: s})
            assert.strictEqual(с.options.prefix, 'foo')
            assert.strictEqual(с.options.serializer, s)
        })

        it('assigns default JSON serializer when not given', () => {
            let с = new CompositeConv([])
            assert.strictEqual(JSON.stringify, с.options.serializer.serialize)
            assert.strictEqual(JSON.parse,     с.options.serializer.parse)
        })

        it('validates given serializer using #validateSerializer()', () => {
            let test = () => new CompositeConv([], {serializer: 'foo'})
            assert.throw(test, 'Invalid serializer: not an object')
        })

        it('throws an error if specs is not an array', () => {
            let test1 = () => new CompositeConv(3),
                test2 = () => new CompositeConv({})
            assert.throw(test1, 'Expected array of specs')
            assert.throw(test2, 'Expected array of specs')
        })

        it('throws if some spec is not valid', () => {
            let test = () => new CompositeConv([{pred: isFoo}])
            assert.throw(test, 'Failed to create predicate converter: missing token')
        })

        it('performs #validateConsistency() on converters made of specs', () => {
            let spec1 = {class: Bar},
                spec2 = {class: Bar},
                test = () => new CompositeConv([spec1, spec2])
            assert.throw(test, 'Inconsistent converters: 2 converters for token Bar')
        })

        it('creates array of UnitConv instances from array of valid specs', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest},
                с = new CompositeConv([spec1, spec2])
            assert.lengthOf(с.unitConvs, 2)
            assert.instanceOf(с.unitConvs[0], UnitClassConv)
            assert.instanceOf(с.unitConvs[1], UnitPredConv)
        })

        it('sorts class converters by the length of the prototype chain', () => {
            class Class1 {}
            class Class2 extends Class1 {}
            class Class3 extends Class2 {}
            let с = new CompositeConv([
                    {class: Class2, dump: () => null},
                    {class: Class3, dump: () => null},
                    {class: Class1, dump: () => null}
                ])
            assert.lengthOf(с.classConvs, 3)
            assert.strictEqual(с.classConvs[0].class, Class3)
            assert.strictEqual(с.classConvs[1].class, Class2)
            assert.strictEqual(с.classConvs[2].class, Class1)
        })

    })

})
