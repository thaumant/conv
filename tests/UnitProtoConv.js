import {assert} from 'chai'
import UnitProtoConv from '../dist/UnitProtoConv'

describe('UnitProtoConv', () => {

    let val = UnitProtoConv.prototype.validateSpec.bind(UnitProtoConv.prototype)

    describe('#validateSpec()', () => {

        it('passes when given instance of UnitProtoConv', () => {
            assert.strictEqual(undefined, val(new UnitProtoConv({token: 'Foo', proto: {}})))
        })

        it('calls UnitConv#validateSpec() at first', () => {
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
            let test1 = () => new UnitProtoConv({proto: {}, token: 2}),
                test2 = () => new UnitProtoConv({proto: 2, token: 'Foo'})
            assert.throw(test1, 'Failed to create proto converter: invalid token')
            assert.throw(test2, 'Failed to create proto converter: invalid proto for Foo')
        })

        it('stores spec.proto as proto property', () => {
            let proto = {},
                c = new UnitProtoConv({token: 'Foo', proto: proto})
            assert.strictEqual(proto, c.proto)
        })

        it('stores spec.token as token property', () => {
            let c = new UnitProtoConv({token: 'Foo'})
            assert.strictEqual('Foo', c.token)
        })

        it('stores restore method if given, otherwise use default restore method', () => {
            let rest = () => {},
                c1 = new UnitProtoConv({token: 'Foo', restore: rest}),
                c2 = new UnitProtoConv({token: 'Foo'})
            assert.strictEqual(c1.restore, rest)
            assert.strictEqual(c2.restore, c2._defaultRestore)
        })

        it('stores dump method as is if function given', () => {
            let dump = () => {},
                c = new UnitProtoConv({token: 'Foo', dump: dump})
            assert.strictEqual(dump, c.dump)
        })

        it('makes dump method that calls specified method if spec.dump method is string', () => {
            let proto = {bar: () => 24},
                val = Object.create(proto),
                c = new UnitProtoConv({token: 'Foo', dump: 'bar'})
            assert.strictEqual(24, c.dump(val))
        })

        it('stores default dump method spec.dump is null/undefined', () => {
            let c = new UnitProtoConv({token: 'Foo'})
            assert.strictEqual(c.dump, c._defaultDump)
        })

        it('sets path property as `namespace.token` or just `token` if no namespace', () => {
            let c1 = new UnitProtoConv({token: 'Foo', namespace: 'foobar'}),
                c2 = new UnitProtoConv({token: 'Foo'})
            assert.strictEqual(c1.path, 'foobar.Foo')
            assert.strictEqual(c2.path, 'Foo')
        })

    })

    describe('#_defaultDump()', () => {

        let _d = UnitProtoConv.prototype._defaultDump

        it('returns new plain object with all own properties of the source', () => {
            let proto = {foo: 3},
                val = Object.create(proto)
            val.bar = 14
            assert.deepEqual(_d(val), {bar: 14})
        })

    })

    describe('#_defaultRestore()', () => {

        it('returns new object with all source properties and converter proto', () => {
            let proto = {foo: 3},
                c = new UnitProtoConv({token: 'Foo', proto: proto}),
                restored = c.restore({bar: 14})
            assert.deepEqual(restored, {foo: 3, bar: 14})
            assert(proto.isPrototypeOf(restored))
        })

    })

})