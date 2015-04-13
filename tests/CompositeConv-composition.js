import {assert} from 'chai'
import CompositeConv from '../dist/CompositeConv'
import {Foo, fooDump, Bar, Baz, Qux} from './aux'


describe('CompositeConv (composition)', () => {

    describe('#extendWith()', () => {
            let fooC = new CompositeConv([{class: Foo, dump: () => null}]),
                barC = new CompositeConv([{class: Bar}]),
                bazC = new CompositeConv([{class: Baz}])

        it('accepts spec, CompositeConv or array of those, returning new instance of CompositeConv', () => {
            let c1 = fooC.extendWith({class: Bar}),
                c2 = fooC.extendWith(barC),
                c3 = fooC.extendWith([{class: Bar}]),
                c4 = fooC.extendWith([barC])
            assert.instanceOf(c1, CompositeConv)
            assert.instanceOf(c2, CompositeConv)
            assert.instanceOf(c3, CompositeConv)
            assert.instanceOf(c4, CompositeConv)
            assert.lengthOf(c1.unitConvs, 2)
            assert.lengthOf(c2.unitConvs, 2)
            assert.lengthOf(c3.unitConvs, 2)
            assert.lengthOf(c4.unitConvs, 2)
        })

        it('collects all specs from provided specs and converters preserving the order', () => {
            let c = bazC.extendWith([
                    fooC.extendWith(barC),
                    {class: Qux}
                ])
            assert.lengthOf(c.unitConvs, 4)
            assert.strictEqual(Baz, c.unitConvs[0].class)
            assert.strictEqual(Foo, c.unitConvs[1].class)
            assert.strictEqual(Bar, c.unitConvs[2].class)
            assert.strictEqual(Qux, c.unitConvs[3].class)
        })

        it('throws an error if some specs have the same token and namespace', () => {
            let c1 = new CompositeConv([{token: 'Foo', namespace: 'foobar', class: Foo, dump: fooDump}]),
                c2 = new CompositeConv([{token: 'Foo', namespace: 'foobar', class: Bar}]),
                test = () => c1.extendWith(c2)
            assert.throw(test, 'Inconsistent converters: 2 converters for token Foo')
        })

        it('throws an error if some spec have the same class', () => {
            let c1 = new CompositeConv([{token: 'Foo', class: Foo, dump: fooDump}]),
                c2 = new CompositeConv([{token: 'Bar', class: Foo, dump: fooDump}]),
                test = () => c1.extendWith(c2)
            assert.throw(test, 'Inconsistent converters: 2 converters for class Foo')
        })

    })

    describe('#overrideBy()', () => {
            let fooC = new CompositeConv([{class: Foo, dump: () => null}]),
                barC = new CompositeConv([{class: Bar}]),
                bazC = new CompositeConv([{class: Baz}])

        it('accepts spec, CompositeConv or array of those, returning new instance of CompositeConv', () => {
            let c1 = fooC.overrideBy({class: Bar}),
                c2 = fooC.overrideBy(barC),
                c3 = fooC.overrideBy([{class: Bar}]),
                c4 = fooC.overrideBy([barC])
            assert.instanceOf(c1, CompositeConv)
            assert.instanceOf(c2, CompositeConv)
            assert.instanceOf(c3, CompositeConv)
            assert.instanceOf(c4, CompositeConv)
            assert.lengthOf(c1.unitConvs, 2)
            assert.lengthOf(c2.unitConvs, 2)
            assert.lengthOf(c3.unitConvs, 2)
            assert.lengthOf(c4.unitConvs, 2)
        })

        it('collects all specs from provided specs and converters preserving the order', () => {
            let c = bazC.overrideBy([
                    fooC.overrideBy(barC),
                    {class: Qux}
                ])
            assert.lengthOf(c.unitConvs, 4)
            assert.strictEqual(Baz, c.unitConvs[0].class)
            assert.strictEqual(Foo, c.unitConvs[1].class)
            assert.strictEqual(Bar, c.unitConvs[2].class)
            assert.strictEqual(Qux, c.unitConvs[3].class)
        })

        it('discards the former when specs have the same token and namespace', () => {
            let c1 = new CompositeConv([{token: 'Foo', namespace: 'foobar', class: Foo, dump: fooDump}]),
                c2 = new CompositeConv([{token: 'Foo', namespace: 'foobar', class: Bar}]),
                c3 = c1.overrideBy(c2)
            assert.lengthOf(c3.unitConvs, 1)
            assert.strictEqual(Bar, c3.unitConvs[0].class)
        })

        it('discards the former when specs have the same class', () => {
            let c1 = new CompositeConv([{token: 'Foo', class: Foo, dump: fooDump}]),
                c2 = new CompositeConv([{token: 'Bar', class: Foo, dump: fooDump}]),
                c3 = c1.overrideBy(c2)
            assert.lengthOf(c3.unitConvs, 1)
            assert.strictEqual('Bar', c3.unitConvs[0].token)
        })

    })

    describe('#withOptions()', () => {

        it('creates new instance of CompositeConv with the same unitConvs', () => {
            let orig = new CompositeConv([{class: Bar}]),
                copy = orig.withOptions({})
            assert.instanceOf(copy, CompositeConv)
            assert.notEqual(copy, orig)
            assert.strictEqual(1, copy.unitConvs.length)
            assert.strictEqual(orig.unitConvs[0], copy.unitConvs[0])
        })

        it('does not change options when given empty object or non-object', () => {
            let serializer = {parse: () => null, serialize: () => null},
                prefix = '?',
                orig = new CompositeConv([{class: Bar}], {serializer: serializer, prefix: prefix}),
                copy1 = orig.withOptions({}),
                copy2 = orig.withOptions(),
                copy3 = orig.withOptions(3)
            assert.strictEqual(prefix, copy1.options.prefix)
            assert.strictEqual(prefix, copy2.options.prefix)
            assert.strictEqual(prefix, copy3.options.prefix)
            assert.strictEqual(serializer, copy1.options.serializer)
            assert.strictEqual(serializer, copy2.options.serializer)
            assert.strictEqual(serializer, copy3.options.serializer)
        })

        it('make a copy of converter with new prefix or serializer', () => {
            let orig = new CompositeConv([{class: Bar}]),
                newPrefix = '?',
                newSerializer = {parse: () => null, serialize: () => null},
                copy1 = orig.withOptions({prefix: newPrefix}),
                copy2 = orig.withOptions({serializer: newSerializer})
            assert.strictEqual(newPrefix, copy1.options.prefix)
            assert.strictEqual(newSerializer, copy2.options.serializer)
        })

    })

    describe('#exclude()', () => {

        it('removes a unit converter with specified class', () => {
            let c1 = new CompositeConv([{class: Bar}, {class: Baz}]),
                c2 = c1.exclude({class: Baz})
            assert.instanceOf(c2, CompositeConv)
            assert.lengthOf(c2.unitConvs, 1)
            assert.strictEqual(c2.unitConvs[0].class, Bar)
        })

        it('removes a unit converter with specified proto', () => {
            let fooProto = {foo: 3},
                barProto = {bar: 14},
                c1 = new CompositeConv([{token: 'Foo', proto: fooProto}, {token: 'Bar', proto: barProto}]),
                c2 = c1.exclude({proto: fooProto})
            assert.instanceOf(c2, CompositeConv)
            assert.lengthOf(c2.unitConvs, 1)
            assert.strictEqual(c2.unitConvs[0].proto, barProto)
        })

        it('removes a unit converter with specified token', () => {
            let c1 = new CompositeConv([
                    {token: 'Foo', class: Bar},
                    {token: 'Foo', class: Baz, namespace: 'baz'}
                ]),
                c2 = c1.exclude({token: 'Foo'})
            assert.instanceOf(c2, CompositeConv)
            assert.lengthOf(c2.unitConvs, 1)
            assert.strictEqual(c2.unitConvs[0].class, Baz)
        })

        it('removes a unit converter with specified namespace', () => {
            let c1 = new CompositeConv([
                    {token: 'Foo', class: Bar},
                    {token: 'Foo', class: Baz, namespace: 'baz'}
                ]),
                c2 = c1.exclude({namespace: 'baz'})
            assert.instanceOf(c2, CompositeConv)
            assert.lengthOf(c2.unitConvs, 1)
            assert.strictEqual(c2.unitConvs[0].class, Bar)
        })

        it('removes a unit converter with specified token and namespace', () => {
            let c1 = new CompositeConv([
                    {token: 'Foo', class: Bar},
                    {token: 'Foo', class: Baz, namespace: 'baz'}
                ]),
                c2 = c1.exclude({token: 'Foo', namespace: 'baz'})
            assert.lengthOf(c2.unitConvs, 1)
            assert.strictEqual(c2.unitConvs[0].class, Bar)
        })

    })

})
