import {assert} from 'chai'
import {inspect} from 'util'
import CompositeT from '../dist/CompositeT'
import UnitPredT from '../dist/UnitPredT'
import UnitClassT from '../dist/UnitClassT'
import {Foo, isFoo, fooEnc, fooDec, foo, Bar, bar, barEnc, Tree, treeRepr, tree, treeSpec} from './aux'


describe('CompositeT', () => {

    describe('#makeUnitT()', () => {

        let make = CompositeT.prototype.makeUnitT

        it('accepts spec and returns correspondent UnitT', () => {
            let spec1 = {class: Bar},
                spec2 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec}
            assert.instanceOf(make(spec1), UnitClassT)
            assert.instanceOf(make(spec2), UnitPredT)
        })

        it('throws an error if cannot determine which transformer to create', () => {
            assert.throws(() => make({}), 'Invalid spec, no class or predicate')
        })

    })

    describe('#validateConsistency()', () => {

        let make = CompositeT.prototype.makeUnitT,
            val  = CompositeT.prototype.validateConsistency

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

        it('passes if there are transformers with the same token but different namespaces', () => {
            let spec1 = {token: 'Foo', class: Foo, encode: fooEnc, namespace: 'foobar'},
                spec2 = {token: 'Foo', class: Bar, encode: barEnc, namespace: 'bazqux'},
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
                spec2 = {token: 'Foo', pred: isFoo, encode: fooEnc, decode: fooDec},
                t = new CompositeT([spec1, spec2])
            assert.lengthOf(t.unitTs, 2)
            assert.instanceOf(t.unitTs[0], UnitClassT)
            assert.instanceOf(t.unitTs[1], UnitPredT)
        })

    })

    describe('#encode()', () => {

        let t = new CompositeT([treeSpec, {class: Foo, encode: fooEnc}])

        it('does not change scalar values by default', () => {
            assert.strictEqual(t.encode(3), 3)
            assert.strictEqual(t.encode('x'), 'x')
            assert.strictEqual(t.encode(null), null)
            assert.strictEqual(t.encode(undefined), undefined)
        })

        it('clones arrays and plain objects by default', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(t.encode(arr), arr)
            assert.notEqual(t.encode(obj), obj)
            assert.deepEqual(t.encode(arr), arr)
            assert.deepEqual(t.encode(obj), obj)
        })

        it('converts instance if spec class matches', () => {
            assert.deepEqual(t.encode(foo), {$Foo: null})
        })

        it('converts value if spec predicate matches', () => {
            assert.deepEqual(t.encode(foo), {$Foo: null})
        })

        it('converts values inside nested arrays and plain objects', () => {
            let arr = [[foo]],
                obj = {baz: {bar: foo}}
            assert.deepEqual(t.encode(arr), [[{$Foo: null}]])
            assert.deepEqual(t.encode(obj), {baz: {bar: {$Foo: null}}})
        })

        it('converts values inside encoded objects', () => {
            assert.deepEqual(t.encode(tree), treeRepr)
        })

        it('uses namespaces along with token if given', () => {
            let t = new CompositeT([{class: Bar, namespace: 'foobar'}])
            assert.deepEqual(t.encode(bar), {'$foobar.Bar': 42})
        })

    })

    describe('#_encode()', () => {

        let t = new CompositeT([])

        it('copies object and array by default', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.notEqual(t._encode(obj), obj)
            assert.notEqual(t._encode(arr), arr)
            assert.deepEqual(t._encode(obj), obj)
            assert.deepEqual(t._encode(arr), arr)
        })

        it('modifies object when `mutate` argument is true', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.strictEqual(t._encode(obj, true), obj)
            assert.strictEqual(t._encode(arr, true), arr)
        })

    })

    describe('#decode()', () => {

        let t = new CompositeT([treeSpec, {class: Foo, encode: fooEnc}])

        it('doesn\'t change scalar values', () => {
            assert.strictEqual(t.decode(3), 3)
            assert.strictEqual(t.decode('x'), 'x')
            assert.strictEqual(t.decode(null), null)
            assert.strictEqual(t.decode(undefined), undefined)
        })

        it('clones arrays and plain objects without tokens', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(t.decode(arr), arr)
            assert.notEqual(t.decode(obj), obj)
            assert.deepEqual(t.decode(arr), arr)
            assert.deepEqual(t.decode(obj), obj)
        })

        it('recognizes tokens in object keys and decodes values', () => {
            assert.instanceOf(t.decode({$Foo: null}), Foo)
        })

        it('recognizes tokens in nested objects and arrays', () => {
            let encoded1 = [[{$Foo: null}]],
                decoded1 = [[foo]],
                encoded2 = {baz: {bar: {$Foo: null}}},
                decoded2 = {baz: {bar: foo}}
            assert.deepEqual(t.decode(encoded1), decoded1)
            assert.deepEqual(t.decode(encoded2), decoded2)
            assert.instanceOf(t.decode(encoded1)[0][0], Foo)
            assert.instanceOf(t.decode(encoded2).baz.bar, Foo)
        })

        it('recreates encoded objects recursively', () => {
            let decoded = t.decode(treeRepr)
            assert.instanceOf(decoded.val, Foo)
            assert.instanceOf(decoded.children[0], Tree)
            assert.instanceOf(decoded.children[0].val, Foo)
        })

        it('recognizes namespaces', () => {
            let encoded1 = {$Bar: 42},
                encoded2 = {'$foobar.Bar': 42},
                t1 = new CompositeT([{class: Bar}]),
                t2 = new CompositeT([{class: Bar, namespace: 'foobar'}]),
                decoded1 = t1.decode([encoded1, encoded2]),
                decoded2 = t2.decode([encoded1, encoded2])
            assert.instanceOf(decoded1[0], Bar)
            assert.deepEqual(decoded1[1], encoded2)
            assert.deepEqual(decoded2[0], encoded1)
            assert.instanceOf(decoded2[1], Bar)
        })

    })

})