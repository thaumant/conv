const {assert} = require('chai'),
    Transformer = require('../dist/Transformer'),
    {inspect} = require('util')


class Foo {
    constructor() {}
    toString() { return '<foo>' }
}
function isFoo(x) { return x instanceof Foo }
function enc(x) { return null }
function dec() { return new Foo() }

class Tree {
    constructor(val, children=[]) {
        this.val = val
        this.children = children.map((child) =>
            child instanceof Tree ? child : new Tree(child))
    }
    toString() {
        let val = this.val.toString(),
            children = this.children.map((c) => c.toString()).join(', ')
        return `Tree{ ${val}, [ ${children} ] }`
    }
}


describe('Transformer', () => {

    let spec1 = {token: 'foo', class: Foo,   encode: enc, decode: dec},
        spec2 = {token: 'foo', class: Foo,   encode: enc},
        spec3 = {token: 'foo', pred:  isFoo, encode: enc, decode: dec},
        t     = new Transformer([spec1]),
        foo   = new Foo


    describe('#validateSpec()', () => {

        let val = Transformer.prototype.validateSpec

        it('passes valid spec', () => {
            assert.strictEqual(undefined, val(spec1))
            assert.strictEqual(undefined, val(spec2))
        })

        it('tells if spec is not a plain object', () => {
            assert.strictEqual('spec is not a plain object', val(null))
            assert.strictEqual('spec is not a plain object', val(2))
        })

        it('tells if there are no correct token', () => {
            assert.strictEqual('missing token', val({class: Foo, encode: enc}))
            assert.strictEqual('missing token', val({class: Foo, encode: enc, token: ''}))
            assert.strictEqual('missing token', val({class: Foo, encode: enc, token: 3}))
        })

        it('tells if there are no correct class or predicate', () => {
            assert.strictEqual('missing class or predicate', val({token: 'foo', encode: enc}))
            assert.strictEqual('missing class or predicate', val({token: 'foo', encode: enc, class: 3}))
            assert.strictEqual('missing class or predicate', val({token: 'foo', encode: enc, pred: 'foo'}))
        })

        it('tells if there are no correct encode method', () => {
            assert.strictEqual('missing encode method', val({token: 'foo', class: Foo}))
            assert.strictEqual('missing encode method', val({token: 'foo', class: Foo, encode: 3}))
        })

        it('tells if there are incorrect decode method', () => {
            assert.strictEqual('invalid decode method', val({token: 'foo', class: Foo, encode: enc, decode: 3}))
        })

    })


    describe('#validateSpecs()', () => {

        let val = Transformer.prototype.validateSpecs.bind(Transformer.prototype)

        it('passes array of valid specs', () => {
            assert.strictEqual(undefined, val([]))
            assert.strictEqual(undefined, val([spec1, spec2]))
        })

        it('tells if non-array given', () => {
            assert.strictEqual('expected array of specs', val(null))
            assert.strictEqual('expected array of specs', val({}))
        })

        it('returns message for the first error found', () => {
            assert.strictEqual('missing encode method', val([{token: 'foo', class: Foo}]))
            assert.strictEqual('missing encode method', val([spec1, {token: 'foo', class: Foo}]))
        })

    })


    describe('#validateConsistency()', () => {

        let val = Transformer.prototype.validateConsistency

        it('passes if there are only one incoder and decoder for each token', () => {
            let barSpec = {token: 'bar', class: Foo, encode: enc, decode: dec}
            assert.strictEqual(undefined, val([spec1, barSpec]))
        })

        it('tells if there are no decoder for some token', () => {
            assert.strictEqual('0 decoders for token foo', val([spec2]))
        })

        it('tells if there are more than one decoder for some token', () => {
            assert.strictEqual('2 decoders for token foo', val([spec1, spec1]))
        })

        it('tells if there are no encoder for some token', () => {
            assert.strictEqual('no encoders for token foo', val([{token: 'foo', class: Foo, decode: dec}]))
        })

        it('passes if there are more than one encoder for some token', () => {
            assert.strictEqual(undefined, val([spec1, spec2]))
        })

    })


    describe('#constructor()', () => {

        it('checks specs with #validateSpecs() throwing it\'s messages as errors', () => {
            let test = () => new Transformer({})
            assert.throws(test, 'Failed to create transformer: expected array of specs')
        })

        it('check specs with #validateConsistency() throwint it\'s messages as errors', () => {
            let test = () => new Transformer([spec2])
            assert.throws(test, 'Failed to create transformer: 0 decoders for token foo')
        })

        it('preserves specs if valid', () => {
            let specs = [spec1, spec2]
            assert.strictEqual(specs, (new Transformer(specs)).specs)
        })

        it('assigns prefix and serializer from params', () => {
            let t = new Transformer([], {prefix: 'foo', serializer: 'bar'})
            assert.strictEqual('foo', t.prefix)
            assert.strictEqual('bar', t.serializer)
        })

        it('uses default prefix and serializer if not provided', () => {
            assert.strictEqual('$', t.prefix)
            assert.strictEqual(JSON, t.serializer)
        })

    })


    let treeSpec = {
            token: 'tree',
            class: Tree,
            encode: (tree) => ({val: tree.val, children: tree.children}),
            decode: (obj) => new Tree(obj.val, obj.children)
        },
        treeT = new Transformer([spec1, treeSpec]),
        tree = new Tree(foo, [new Tree(foo)]),
        treeRepr = {$tree: {
            val: {$foo: null},
            children: [
                {$tree: {
                    val: {$foo: null},
                    children: []
                }}
            ]
        }}


    describe('#encode()', () => {

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
            assert.deepEqual(t.encode(foo), {$foo: null})
        })

        it('converts value if spec predicate matches', () => {
            let t = new Transformer([spec3])
            assert.deepEqual(t.encode(foo), {$foo: null})
        })

        it('converts values inside nested arrays and plain objects', () => {
            let arr = [[foo]],
                obj = {baz: {bar: foo}}
            assert.deepEqual(t.encode(arr), [[{$foo: null}]])
            assert.deepEqual(t.encode(obj), {baz: {bar: {$foo: null}}})
        })

        it('converts values inside encoded objects', () => {
            assert.deepEqual(treeT.encode(tree), treeRepr)
        })

    })


    describe('#_encode()', () => {

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
            assert.instanceOf(t.decode({$foo: null}), Foo)
        })

        it('recognizes tokens in nested objects and arrays', () => {
            let encoded1 = [[{$foo: null}]],
                decoded1 = [[foo]],
                encoded2 = {baz: {bar: {$foo: null}}},
                decoded2 = {baz: {bar: foo}}
            assert.deepEqual(t.decode(encoded1), decoded1)
            assert.deepEqual(t.decode(encoded2), decoded2)
            assert.instanceOf(t.decode(encoded1)[0][0], Foo)
            assert.instanceOf(t.decode(encoded2).baz.bar, Foo)
        })

        it('recreates encoded objects recursively', () => {
            let decoded = treeT.decode(treeRepr)
            assert.instanceOf(decoded.val, Foo)
            assert.instanceOf(decoded.children[0], Tree)
            assert.instanceOf(decoded.children[0].val, Foo)
        })

    })

})
