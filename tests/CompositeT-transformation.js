import {assert} from 'chai'
!isFunc()import CompositeT from '../dist/CompositeT'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, bar, barDump, Tree, treeRepr, tree, treeSpec} from './aux'


describe('CompositeT (transformation)', () => {

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

        it('converts value if class matches', () => {
            assert.deepEqual(t.dump(foo), {$Foo: null})
        })

        it('converts value if proto matches', () => {
            let proto = {bar: 3},
                val = Object.create(proto),
                t = new CompositeT([{token: 'X', proto: proto}])
            val.baz = 14
            assert.deepEqual(t.dump(val), {$X: {baz: 14}})
        })

        it('converts value if predicate matches', () => {
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

        it('applies closes class transformer first', () => {
            class Class1 {}
            class Class2 {}
            class Class3 {}
            let t = new CompositeT([
                {class: Class2, dump: () => null},
                {class: Class1, dump: () => null},
                {class: Class3, dump: () => null}
            ])
            assert.deepEqual({$Class3: null}, t.dump(new Class3))
            assert.deepEqual({$Class2: null}, t.dump(new Class2))
            assert.deepEqual({$Class1: null}, t.dump(new Class1))
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

    describe('#serialize()', () => {

        let t = new CompositeT([{class: Foo, dump: fooDump}])

        it('passes all arguments to serializer#serialize() method', () => {
            assert.strictEqual('{\n    "foo": 3\n}', t.serialize({foo: 3}, null, 4))
        })

        it('dumps given value before serialization', () => {
            assert.strictEqual('{"$Foo":null}', t.serialize(foo))
        })

    })

    describe('#parse()', () => {

        let t = new CompositeT([{class: Foo, dump: fooDump}])

        it('calls serializer#parse() to parse provided string', () => {
            assert.deepEqual({foo: 3}, t.parse('{"foo":3}'))
        })

        it('restores parsed JSON', () => {
            let parsed = t.parse('{"$Foo": null}')
            assert.instanceOf(parsed, Foo)
        })

    })

})
