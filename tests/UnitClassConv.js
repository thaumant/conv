import {assert} from 'chai'
import UnitClassConv from '../dist/UnitClassConv'
import {Foo, fooRest, fooDump, Bar, barRest, barDump} from './aux'

describe('UnitClassConv', () => {

    describe('#validateSpec()', () => {

        let val = UnitClassConv.prototype.validateSpec.bind(UnitClassConv.prototype)

        it('passes when given instance of UnitClassConv', () => {
            assert.strictEqual(undefined, val(new UnitClassConv({class: Bar})))
        })

        it('calls UnitConv#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if token is given and it is not a valid string', () => {
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: 2}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: {}}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: '$%^'}))
        })

        it('tells if namespace is given and it is not a valid non-empty string', () => {
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: 2}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: {}}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: '$%^'}))
        })

        it('tells when no token given and constructor has no name', () => {
            assert.strictEqual('missing token and no class name', val({class: () => null, dump: fooDump}))
        })

        it('tells if class is not a function', () => {
            assert.strictEqual('invalid class for Foo', val({token: 'Foo', class: 2}))
        })

        it('tells if restore method is given and it is not a function', () => {
            assert.strictEqual('invalid restore method for Foo', val({token: 'Foo', class: Foo, restore: 2}))
        })

        it('tells if dump method is given and it is not a function or string', () => {
            assert.strictEqual('invalid dump method for Foo', val({token: 'Foo', class: Foo, restore: fooRest, dump: 2}))
            assert.strictEqual('invalid dump method for Foo', val({token: 'Foo', class: Foo, restore: fooRest, dump: {}}))
        })

        it('tells if dump method is missing and class has no #toJSON() method', () => {
            assert.strictEqual('missing dump method for Foo', val({token: 'Foo', class: Foo, restore: fooRest}))
        })

        it('passes if no dump method given but clas has #toJSON() method', () => {
            assert.strictEqual(undefined, val({class: Bar, restore: barRest}))
        })

        it('passes if null/undefined restore method or token given', () => {
            assert.strictEqual(undefined, val({class: Bar, dump: barDump}))
        })

        it('needs only class param if class has #toJSON() method', () => {
            assert.strictEqual(undefined, val({class: Bar}))
        })

    })

    
    describe('#constructor()', () => {

        it('performs #validateSpec()', () => {
            let test1 = () => new UnitClassConv({class: Foo, token: 2}),
                test2 = () => new UnitClassConv({token: 'Foo', class: Foo, restore: fooRest})
            assert.throw(test1, 'Failed to create class converter: invalid token for Foo')
            assert.throw(test2, 'Failed to create class converter: missing dump method for Foo')
        })

        it('stores spec.class as spec property', () => {
            let c = new UnitClassConv({class: Bar})
            assert.strictEqual(Bar, c.class)
        })

        it('stores spec.token if given, otherwise make token from class name', () => {
            let c1 = new UnitClassConv({class: Bar, token: 'Baz'}),
                c2 = new UnitClassConv({class: Bar})
            assert.strictEqual('Baz', c1.token)
            assert.strictEqual('Bar', c2.token)
        })

        it('stores restore method if given, otherwise make restore method that calls class constructor', () => {
            let c1 = new UnitClassConv({class: Bar, restore: barRest}),
                c2 = new UnitClassConv({class: Bar}),
                restored = c2.restore(3)
            assert.strictEqual(barRest, c1.restore)
            assert.instanceOf(restored, Bar)
            assert.strictEqual(3, restored.arg1)
            assert.strictEqual(undefined, restored.arg2)
        })

        it('stores dump method as is if function given', () => {
            let c = new UnitClassConv({class: Bar, dump: barDump})
            assert.strictEqual(barDump, c.dump)
        })

        it('makes dump method that calls specified method if spec.dump method is string', () => {
            let c = new UnitClassConv({class: Bar, dump: 'bar'})
            assert.strictEqual(24, c.dump(new Bar))
        })

        it('uses #toJSON() if exists and no dump method given', () => {
            let c = new UnitClassConv({class: Bar})
            assert.strictEqual(42, c.dump(new Bar))
        })

        it('stores spec.namespace as namespace property', () => {
            let c1 = new UnitClassConv({class: Bar, namespace: 'foobar'}),
                c2 = new UnitClassConv({class: Bar})
            assert.strictEqual('foobar', c1.namespace)
            assert.strictEqual(undefined, c2.namespace)
        })

        it('sets path property as `namespace.token` or just `token` if no namespace', () => {
            let c1 = new UnitClassConv({class: Bar, namespace: 'foobar'}),
                c2 = new UnitClassConv({class: Bar})
            assert.strictEqual(c1.path, 'foobar.Bar')
            assert.strictEqual(c2.path, 'Bar')
        })

    })

})