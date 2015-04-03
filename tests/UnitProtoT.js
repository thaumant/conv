import {assert} from 'chai'
import {inspect} from 'util'
import UnitProtoT from '../dist/UnitProtoT'

describe('UnitProtoT', () => {

    let val = UnitProtoT.prototype.validateSpec.bind(UnitProtoT.prototype)

    describe('#validateSpec()', () => {

        it('passes when given instance of UnitProtoT', () => {
            assert.strictEqual(undefined, val(new UnitProtoT({token: 'Foo', proto: {}})))
        })

        it('calls UnitT#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if token is given and it is not a valid string', () => {
            assert.strictEqual('invalid token', val({proto: {}, token: 2}))
            assert.strictEqual('invalid token', val({proto: {}, token: {}}))
            assert.strictEqual('invalid token', val({proto: {}, token: '$%^'}))
        })

        it('tells if namespace is given and it is not a valid non-empty string', () => {
            assert.strictEqual('invalid namespace for Foo', val({token: 'Foo', proto: {}, namespace: 2}))
            assert.strictEqual('invalid namespace for Foo', val({token: 'Foo', proto: {}, namespace: {}}))
            assert.strictEqual('invalid namespace for Foo', val({token: 'Foo', proto: {}, namespace: '$%^'}))
        })

        it('tells if proto is a scalar value', () => {
            assert.strictEqual('invalid proto for Foo', val({token: 'Foo', proto: 2}))
            assert.strictEqual('invalid proto for Foo', val({token: 'Foo', proto: 'foo'}))
        })

        it('tells if restore method is given and it is not a function', () => {
            assert.strictEqual('invalid restore method for Foo', val({token: 'Foo', proto: {}, restore: 2}))
        })

        it('tells if dump method is given and it is not a function or string', () => {
            assert.strictEqual('invalid dump method for Foo', val({token: 'Foo', proto: {}, dump: 2}))
            assert.strictEqual('invalid dump method for Foo', val({token: 'Foo', proto: {}, dump: {}}))
        })

        it('passes null proto', () => {
            assert.strictEqual(undefined, val({token: 'Foo', proto: null}))
            assert.strictEqual(undefined, val({token: 'Foo'}))
        })

        it('passes on null/undefined values for dump and restore', () => {
            assert.strictEqual(undefined, val({token: 'Foo', dump: null, restore: null}))
            assert.strictEqual(undefined, val({token: 'Foo'}))
        })

    })

    describe('#constructor()', () => {

        it('performs #validateSpec()', () => {
            let test1 = () => new UnitProtoT({proto: {}, token: 2}),
                test2 = () => new UnitProtoT({proto: 2, token: 'Foo'})
            assert.throw(test1, 'Failed to create proto transformer: invalid token')
            assert.throw(test2, 'Failed to create proto transformer: invalid proto for Foo')
        })

        it('stores spec.proto as proto property', () => {
            let proto = {},
                t = new UnitProtoT({token: 'Foo', proto: proto})
            assert.strictEqual(proto, t.proto)
        })

        it('stores spec.token as token property', () => {
            let t = new UnitProtoT({token: 'Foo'})
            assert.strictEqual('Foo', t.token)
        })

        it('stores restore method if given, otherwise use default restore method', () => {
            let rest = () => {},
                t1 = new UnitProtoT({token: 'Foo', restore: rest}),
                t2 = new UnitProtoT({token: 'Foo'})
            assert.strictEqual(t1.restore, rest)
            assert.strictEqual(t2.restore, t2._defaultRestore)
        })

        it('stores dump method as is if function given', () => {
            let dump = () => {},
                t = new UnitProtoT({token: 'Foo', dump: dump})
            assert.strictEqual(dump, t.dump)
        })

        it('makes dump method that calls specified method if spec.dump method is string', () => {
            let proto = {bar: () => 24},
                val = Object.create(proto),
                t = new UnitProtoT({token: 'Foo', dump: 'bar'})
            assert.strictEqual(24, t.dump(val))
        })

        it('stores default dump method spec.dump is null/undefined', () => {
            let t = new UnitProtoT({token: 'Foo'})
            assert.strictEqual(t.dump, t._defaultDump)
        })

        it('sets path property as `namespace.token` or just `token` if no namespace', () => {
            let t1 = new UnitProtoT({token: 'Foo', namespace: 'foobar'}),
                t2 = new UnitProtoT({token: 'Foo'})
            assert.strictEqual(t1.path, 'foobar.Foo')
            assert.strictEqual(t2.path, 'Foo')
        })

    })

    describe('#_defaultDump()', () => {

        let _d = UnitProtoT.prototype._defaultDump

        it('returns new plain object with all own properties of the source', () => {
            let proto = {foo: 3},
                val = Object.create(proto)
            val.bar = 14
            assert.deepEqual(_d(val), {bar: 14})
        })

    })

    describe('#_defaultRestore()', () => {

        it('returns new object with all source properties and transformer proto', () => {
            let proto = {foo: 3},
                t = new UnitProtoT({token: 'Foo', proto: proto}),
                restored = t.restore({bar: 14})
            assert.deepEqual(restored, {foo: 3, bar: 14})
            assert(proto.isPrototypeOf(restored))
        })

    })

})