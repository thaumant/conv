import {assert} from 'chai'
import CompositeConv from '../dist/CompositeConv'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, bar, barDump, Tree, treeRepr, tree, treeSpec} from './aux'


describe('CompositeConv (transformation)', () => {

    describe('#dump()', () => {

        let c = new CompositeConv([treeSpec, {class: Foo, dump: fooDump}])

        it('does not change scalar values by default', () => {
            assert.strictEqual(c.dump(3), 3)
            assert.strictEqual(c.dump('x'), 'x')
            assert.strictEqual(c.dump(null), null)
            assert.strictEqual(c.dump(undefined), undefined)
        })

        it('clones arrays and plain objects by default', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(c.dump(arr), arr)
            assert.notEqual(c.dump(obj), obj)
            assert.deepEqual(c.dump(arr), arr)
            assert.deepEqual(c.dump(obj), obj)
        })

        it('converts value if class matches', () => {
            assert.deepEqual(c.dump(foo), {$Foo: null})
        })

        it('converts value if proto matches', () => {
            let proto = {bar: 3},
                val = Object.create(proto),
                c = new CompositeConv([{token: 'X', proto: proto}])
            val.baz = 14
            assert.deepEqual(c.dump(val), {$X: {baz: 14}})
        })

        it('converts value if predicate matches', () => {
            assert.deepEqual(c.dump(foo), {$Foo: null})
        })

        it('converts values inside nested arrays and plain objects', () => {
            let arr = [[foo]],
                obj = {baz: {bar: foo}}
            assert.deepEqual(c.dump(arr), [[{$Foo: null}]])
            assert.deepEqual(c.dump(obj), {baz: {bar: {$Foo: null}}})
        })

        it('converts values inside dumped objects', () => {
            assert.deepEqual(c.dump(tree), treeRepr)
        })

        it('uses namespaces along with token if given', () => {
            let c = new CompositeConv([{class: Bar, namespace: 'foobar'}])
            assert.deepEqual(c.dump(bar), {'$foobar.Bar': 42})
        })

        it('applies predicate converters before class ts', () => {
            let c = new CompositeConv([
                {token: 'Foo', class: Foo, dump: fooDump, restore: fooRest},
                {token: 'Bar', pred: isFoo, dump: fooDump, restore: fooRest}
            ])
            assert.deepEqual({$Bar: null}, c.dump(new Foo))
        })

        it('applies closes class converter first', () => {
            class Class1 {}
            class Class2 {}
            class Class3 {}
            let c = new CompositeConv([
                {class: Class2, dump: () => null},
                {class: Class1, dump: () => null},
                {class: Class3, dump: () => null}
            ])
            assert.deepEqual({$Class3: null}, c.dump(new Class3))
            assert.deepEqual({$Class2: null}, c.dump(new Class2))
            assert.deepEqual({$Class1: null}, c.dump(new Class1))
        })

    })

    describe('#_dump()', () => {

        let c = new CompositeConv([])

        it('copies object and array by default', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.notEqual(c._dump(obj), obj)
            assert.notEqual(c._dump(arr), arr)
            assert.deepEqual(c._dump(obj), obj)
            assert.deepEqual(c._dump(arr), arr)
        })

        it('modifies object when `mutate` argument is true', () => {
            let obj = {foo: 3, bar: 14},
                arr = [3, 14]
            assert.strictEqual(c._dump(obj, true), obj)
            assert.strictEqual(c._dump(arr, true), arr)
        })

    })

    describe('#restore()', () => {

        let c = new CompositeConv([treeSpec, {class: Foo, dump: fooDump}])

        it('doesn\'t change scalar values', () => {
            assert.strictEqual(c.restore(3), 3)
            assert.strictEqual(c.restore('x'), 'x')
            assert.strictEqual(c.restore(null), null)
            assert.strictEqual(c.restore(undefined), undefined)
        })

        it('clones arrays and plain objects without tokens', () => {
            let arr = [3],
                obj = {x: 3}
            assert.notEqual(c.restore(arr), arr)
            assert.notEqual(c.restore(obj), obj)
            assert.deepEqual(c.restore(arr), arr)
            assert.deepEqual(c.restore(obj), obj)
        })

        it('recognizes tokens in object keys and restores values', () => {
            assert.instanceOf(c.restore({$Foo: null}), Foo)
        })

        it('recognizes tokens in nested objects and arrays', () => {
            let dumped1 = [[{$Foo: null}]],
                restored1 = [[foo]],
                dumped2 = {baz: {bar: {$Foo: null}}},
                restored2 = {baz: {bar: foo}}
            assert.deepEqual(c.restore(dumped1), restored1)
            assert.deepEqual(c.restore(dumped2), restored2)
            assert.instanceOf(c.restore(dumped1)[0][0], Foo)
            assert.instanceOf(c.restore(dumped2).baz.bar, Foo)
        })

        it('recreates dumped objects recursively', () => {
            let restored = c.restore(treeRepr)
            assert.instanceOf(restored.val, Foo)
            assert.instanceOf(restored.children[0], Tree)
            assert.instanceOf(restored.children[0].val, Foo)
        })

        it('recognizes namespaces', () => {
            let dumped1 = {$Bar: 42},
                dumped2 = {'$foobar.Bar': 42},
                t1 = new CompositeConv([{class: Bar}]),
                t2 = new CompositeConv([{class: Bar, namespace: 'foobar'}]),
                restored1 = t1.restore([dumped1, dumped2]),
                restored2 = t2.restore([dumped1, dumped2])
            assert.instanceOf(restored1[0], Bar)
            assert.deepEqual(restored1[1], dumped2)
            assert.deepEqual(restored2[0], dumped1)
            assert.instanceOf(restored2[1], Bar)
        })

    })

    describe('#restoreUnsafe()', () => {

        let c = new CompositeConv([treeSpec, {class: Foo, dump: fooDump}])

        it('doesn\'t change scalar values', () => {
            assert.strictEqual(c.restoreUnsafe(3), 3)
            assert.strictEqual(c.restoreUnsafe('x'), 'x')
            assert.strictEqual(c.restoreUnsafe(null), null)
            assert.strictEqual(c.restoreUnsafe(undefined), undefined)
        })

        it('doesn\'t change arrays and plain objects without tokens', () => {
            let arr = [3],
                obj = {x: 3}
            assert.strictEqual(c.restoreUnsafe(arr), arr)
            assert.strictEqual(c.restoreUnsafe(obj), obj)
        })

        it('mutates structures instead of cloning it', () => {
            let dumped = {foo: [ {$Foo: null} ]},
                restored = c.restoreUnsafe(dumped)
            assert.strictEqual(restored, dumped)
            assert.strictEqual(restored.foo, dumped.foo)
            assert.strictEqual(restored.foo[0], dumped.foo[0])
            assert.instanceOf(restored.foo[0], Foo)
            assert.instanceOf(dumped.foo[0], Foo)
        })

    })

    describe('#serialize()', () => {

        let c = new CompositeConv([{class: Foo, dump: fooDump}])

        it('passes all arguments to serializer#serialize() method', () => {
            assert.strictEqual('{\n    "foo": 3\n}', c.serialize({foo: 3}, null, 4))
        })

        it('dumps given value before serialization', () => {
            assert.strictEqual('{"$Foo":null}', c.serialize(foo))
        })

    })

    describe('#parse()', () => {

        let c = new CompositeConv([{class: Foo, dump: fooDump}])

        it('calls serializer#parse() to parse provided string', () => {
            assert.deepEqual({foo: 3}, c.parse('{"foo":3}'))
        })

        it('restores parsed JSON', () => {
            let parsed = c.parse('{"$Foo": null}')
            assert.instanceOf(parsed, Foo)
        })

    })

})
