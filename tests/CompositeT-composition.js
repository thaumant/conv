import {assert} from 'chai'
import {inspect} from 'util'
import CompositeT from '../dist/CompositeT'
import {Foo, fooDump, Bar, Baz, Qux} from './aux'


describe('CompositeT (composition)', () => {

    describe('#extendWith()', () => {
            let fooT = new CompositeT([{class: Foo, dump: () => null}]),
                barT = new CompositeT([{class: Bar}]),
                bazT = new CompositeT([{class: Baz}])

        it('accepts spec, CompositeT or array of those, returning new instance of CompositeT', () => {
            let t1 = fooT.extendWith({class: Bar}),
                t2 = fooT.extendWith(barT),
                t3 = fooT.extendWith([{class: Bar}]),
                t4 = fooT.extendWith([barT])
            assert.instanceOf(t1, CompositeT)
            assert.instanceOf(t2, CompositeT)
            assert.instanceOf(t3, CompositeT)
            assert.instanceOf(t4, CompositeT)
            assert.lengthOf(t1.unitTs, 2)
            assert.lengthOf(t2.unitTs, 2)
            assert.lengthOf(t3.unitTs, 2)
            assert.lengthOf(t4.unitTs, 2)
        })

        it('collects all specs from provided specs and transformers preserving the order', () => {
            let t = bazT.extendWith([
                    fooT.extendWith(barT),
                    {class: Qux}
                ])
            assert.lengthOf(t.unitTs, 4)
            assert.strictEqual(Baz, t.unitTs[0].class)
            assert.strictEqual(Foo, t.unitTs[1].class)
            assert.strictEqual(Bar, t.unitTs[2].class)
            assert.strictEqual(Qux, t.unitTs[3].class)
        })

        it('throws an error if some specs have the same token and namespace', () => {
            let t1 = new CompositeT([{token: 'Foo', namespace: 'foobar', class: Foo, dump: fooDump}]),
                t2 = new CompositeT([{token: 'Foo', namespace: 'foobar', class: Bar}]),
                test = () => t1.extendWith(t2)
            assert.throw(test, 'Inconsistent transformers: 2 transformers for token Foo')
        })

        it('throws an error if some spec have the same class', () => {
            let t1 = new CompositeT([{token: 'Foo', class: Foo, dump: fooDump}]),
                t2 = new CompositeT([{token: 'Bar', class: Foo, dump: fooDump}]),
                test = () => t1.extendWith(t2)
            assert.throw(test, 'Inconsistent transformers: 2 transformers for class Foo')
        })

    })

    describe('#overrideBy()', () => {
            let fooT = new CompositeT([{class: Foo, dump: () => null}]),
                barT = new CompositeT([{class: Bar}]),
                bazT = new CompositeT([{class: Baz}])

        it('accepts spec, CompositeT or array of those, returning new instance of CompositeT', () => {
            let t1 = fooT.overrideBy({class: Bar}),
                t2 = fooT.overrideBy(barT),
                t3 = fooT.overrideBy([{class: Bar}]),
                t4 = fooT.overrideBy([barT])
            assert.instanceOf(t1, CompositeT)
            assert.instanceOf(t2, CompositeT)
            assert.instanceOf(t3, CompositeT)
            assert.instanceOf(t4, CompositeT)
            assert.lengthOf(t1.unitTs, 2)
            assert.lengthOf(t2.unitTs, 2)
            assert.lengthOf(t3.unitTs, 2)
            assert.lengthOf(t4.unitTs, 2)
        })

        it('collects all specs from provided specs and transformers preserving the order', () => {
            let t = bazT.overrideBy([
                    fooT.overrideBy(barT),
                    {class: Qux}
                ])
            assert.lengthOf(t.unitTs, 4)
            assert.strictEqual(Baz, t.unitTs[0].class)
            assert.strictEqual(Foo, t.unitTs[1].class)
            assert.strictEqual(Bar, t.unitTs[2].class)
            assert.strictEqual(Qux, t.unitTs[3].class)
        })

        it('discards the former when specs have the same token and namespace', () => {
            let t1 = new CompositeT([{token: 'Foo', namespace: 'foobar', class: Foo, dump: fooDump}]),
                t2 = new CompositeT([{token: 'Foo', namespace: 'foobar', class: Bar}]),
                t3 = t1.overrideBy(t2)
            assert.lengthOf(t3.unitTs, 1)
            assert.strictEqual(Bar, t3.unitTs[0].class)
        })

        it('discards the former when specs have the same class', () => {
            let t1 = new CompositeT([{token: 'Foo', class: Foo, dump: fooDump}]),
                t2 = new CompositeT([{token: 'Bar', class: Foo, dump: fooDump}]),
                t3 = t1.overrideBy(t2)
            assert.lengthOf(t3.unitTs, 1)
            assert.strictEqual('Bar', t3.unitTs[0].token)
        })

    })

    describe('#withOptions()', () => {

        it('creates new instance of CompositeT with the same unitTs', () => {
            let orig = new CompositeT([{class: Bar}]),
                copy = orig.withOptions({})
            assert.instanceOf(copy, CompositeT)
            assert.notEqual(copy, orig)
            assert.strictEqual(1, copy.unitTs.length)
            assert.strictEqual(orig.unitTs[0], copy.unitTs[0])
        })

        it('does not change options when given empty object or non-object', () => {
            let serializer = {parse: () => null, stringify: () => null},
                prefix = '?',
                orig = new CompositeT([{class: Bar}], {serializer: serializer, prefix: prefix}),
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

        it('make a copy of transformer with new prefix or serializer', () => {
            let orig = new CompositeT([{class: Bar}]),
                newPrefix = '?',
                newSerializer = {parse: () => null, stringify: () => null},
                copy1 = orig.withOptions({prefix: newPrefix}),
                copy2 = orig.withOptions({serializer: newSerializer})
            assert.strictEqual(newPrefix, copy1.options.prefix)
            assert.strictEqual(newSerializer, copy2.options.serializer)
        })

    })

})
