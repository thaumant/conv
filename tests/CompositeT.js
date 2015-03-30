import {assert} from 'chai'
import {inspect} from 'util'
import CompositeT from '../dist/CompositeT'
import UnitPredT from '../dist/UnitPredT'
import UnitClassT from '../dist/UnitClassT'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, bar, barDump, Tree, treeRepr, tree, treeSpec, Baz, Qux} from './aux'


describe('CompositeT', () => {

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

    describe('#dump()', () => {

        let t = new CompositeT([treeSpec, {class: Foo, dump: fooDump}])

        it('does not change scalar values by default', () => {
            assert.strictEqual(t.dump(3), 3)
            assert.strictEqual(t.dump('x'), 'x')
            assert.strictEqual(t.dump(null), null)
            assert.strictEqual(t.dump(undefined), undefined)
        })

        it('clones arrays and plain objects by default', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(t.dump(arr), arr)
            assert.notEqual(t.dump(obj), obj)
            assert.deepEqual(t.dump(arr), arr)
            assert.deepEqual(t.dump(obj), obj)
        })

        it('converts instance if spec class matches', () => {
            assert.deepEqual(t.dump(foo), {$Foo: null})
        })

        it('converts value if spec predicate matches', () => {
            assert.deepEqual(t.dump(foo), {$Foo: null})
        })

        it('converts values inside nested arrays and plain objects', () => {
            let arr = [[foo]],
                obj = {baz: {bar: foo}}
            assert.deepEqual(t.dump(arr), [[{$Foo: null}]])
            assert.deepEqual(t.dump(obj), {baz: {bar: {$Foo: null}}})
        })

        it('converts values inside dumped objects', () => {
            assert.deepEqual(t.dump(tree), treeRepr)
        })

        it('uses namespaces along with token if given', () => {
            let t = new CompositeT([{class: Bar, namespace: 'foobar'}])
            assert.deepEqual(t.dump(bar), {'$foobar.Bar': 42})
        })

        it('applies predicate transformers before class ts', () => {
            let t = new CompositeT([
                {token: 'Foo', class: Foo, dump: fooDump, restore: fooRest},
                {token: 'Bar', pred: isFoo, dump: fooDump, restore: fooRest}
            ])
            assert.deepEqual({$Bar: null}, t.dump(new Foo))
        })

    })

    describe('#_dump()', () => {

        let t = new CompositeT([])

        it('copies object and array by default', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.notEqual(t._dump(obj), obj)
            assert.notEqual(t._dump(arr), arr)
            assert.deepEqual(t._dump(obj), obj)
            assert.deepEqual(t._dump(arr), arr)
        })

        it('modifies object when `mutate` argument is true', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.strictEqual(t._dump(obj, true), obj)
            assert.strictEqual(t._dump(arr, true), arr)
        })

    })

    describe('#restore()', () => {

        let t = new CompositeT([treeSpec, {class: Foo, dump: fooDump}])

        it('doesn\'t change scalar values', () => {
            assert.strictEqual(t.restore(3), 3)
            assert.strictEqual(t.restore('x'), 'x')
            assert.strictEqual(t.restore(null), null)
            assert.strictEqual(t.restore(undefined), undefined)
        })

        it('clones arrays and plain objects without tokens', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(t.restore(arr), arr)
            assert.notEqual(t.restore(obj), obj)
            assert.deepEqual(t.restore(arr), arr)
            assert.deepEqual(t.restore(obj), obj)
        })

        it('recognizes tokens in object keys and restores values', () => {
            assert.instanceOf(t.restore({$Foo: null}), Foo)
        })

        it('recognizes tokens in nested objects and arrays', () => {
            let dumped1 = [[{$Foo: null}]],
                restored1 = [[foo]],
                dumped2 = {baz: {bar: {$Foo: null}}},
                restored2 = {baz: {bar: foo}}
            assert.deepEqual(t.restore(dumped1), restored1)
            assert.deepEqual(t.restore(dumped2), restored2)
            assert.instanceOf(t.restore(dumped1)[0][0], Foo)
            assert.instanceOf(t.restore(dumped2).baz.bar, Foo)
        })

        it('recreates dumped objects recursively', () => {
            let restored = t.restore(treeRepr)
            assert.instanceOf(restored.val, Foo)
            assert.instanceOf(restored.children[0], Tree)
            assert.instanceOf(restored.children[0].val, Foo)
        })

        it('recognizes namespaces', () => {
            let dumped1 = {$Bar: 42},
                dumped2 = {'$foobar.Bar': 42},
                t1 = new CompositeT([{class: Bar}]),
                t2 = new CompositeT([{class: Bar, namespace: 'foobar'}]),
                restored1 = t1.restore([dumped1, dumped2]),
                restored2 = t2.restore([dumped1, dumped2])
            assert.instanceOf(restored1[0], Bar)
            assert.deepEqual(restored1[1], dumped2)
            assert.deepEqual(restored2[0], dumped1)
            assert.instanceOf(restored2[1], Bar)
        })

    })

    describe('#restoreUnsafe()', () => {

        let t = new CompositeT([treeSpec, {class: Foo, dump: fooDump}])

        it('doesn\'t change scalar values', () => {
            assert.strictEqual(t.restoreUnsafe(3), 3)
            assert.strictEqual(t.restoreUnsafe('x'), 'x')
            assert.strictEqual(t.restoreUnsafe(null), null)
            assert.strictEqual(t.restoreUnsafe(undefined), undefined)
        })

        it('doesn\'t change arrays and plain objects without tokens', () => {
            let arr = [3],
                obj = {x: 3}
            assert.strictEqual(t.restoreUnsafe(arr), arr)
            assert.strictEqual(t.restoreUnsafe(obj), obj)
        })

        it('mutates structures instead of cloning it', () => {
            let dumped = {foo: [ {$Foo: null} ]},
                restored = t.restoreUnsafe(dumped)
            assert.strictEqual(restored, dumped)
            assert.strictEqual(restored.foo, dumped.foo)
            assert.strictEqual(restored.foo[0], dumped.foo[0])
            assert.instanceOf(restored.foo[0], Foo)
            assert.instanceOf(dumped.foo[0], Foo)
        })

    })

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