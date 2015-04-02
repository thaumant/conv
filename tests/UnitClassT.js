import {assert} from 'chai'
import {inspect} from 'util'
import UnitClassT from '../dist/UnitClassT'
import {Foo, fooRest, fooDump, Bar, barRest, barDump} from './aux'

describe('UnitClassT', () => {

    describe('#validateSpec()', () => {

        let val = UnitClassT.prototype.validateSpec.bind(UnitClassT.prototype)

        it('passes when given instance of UnitClassT', () => {
            assert.strictEqual(undefined, val(new UnitClassT({class: Bar})))
        })

        it('calls UnitT#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if token is given and it is not a valid string', () => {
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: 2}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: {}}))
            assert.strictEqual('invalid token for Foo', val({class: Foo, token: '$%^'}))
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

        it('passes if falsy restore method or token given', () => {
            assert.strictEqual(undefined, val({class: Bar, dump: barDump}))
        })

        it('needs only class param if class has #toJSON() method', () => {
            assert.strictEqual(undefined, val({class: Bar}))
        })

        it('tells if namespace is given and it is not a non-empty string', () => {
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: 2}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: {}}))
            assert.strictEqual('invalid namespace for Bar', val({class: Bar, namespace: '$%^'}))
        })

    })

    
    describe('#constructor()', () => {

        it('performs #validateSpec()', () => {
            let test1 = () => new UnitClassT({class: Foo, token: 2}),
                test2 = () => new UnitClassT({token: 'Foo', class: Foo, restore: fooRest})
            assert.throw(test1, 'Failed to create class transformer: invalid token for Foo')
            assert.throw(test2, 'Failed to create class transformer: missing dump method for Foo')
        })

        it('stores spec.class as spec property', () => {
            let t = new UnitClassT({class: Bar})
            assert.strictEqual(Bar, t.class)
        })

        it('stores spec.token if given, otherwise make token from class name', () => {
            let t1 = new UnitClassT({class: Bar, token: 'Baz'}),
                t2 = new UnitClassT({class: Bar})
            assert.strictEqual('Baz', t1.token)
            assert.strictEqual('Bar', t2.token)
        })

        it('stores restore method if given, otherwise make restore method that calls class constructor', () => {
            let t1 = new UnitClassT({class: Bar, restore: barRest}),
                t2 = new UnitClassT({class: Bar}),
                restored = t2.restore(3)
            assert.strictEqual(barRest, t1.restore)
            assert.instanceOf(restored, Bar)
            assert.strictEqual(3, restored.arg1)
            assert.strictEqual(undefined, restored.arg2)
        })

        it('stores dump method as is if function given', () => {
            let t = new UnitClassT({class: Bar, dump: barDump})
            assert.strictEqual(barDump, t.dump)
        })

        it('makes dump method that calls specified method if spec.dump method is string', () => {
            let t = new UnitClassT({class: Bar, dump: 'bar'})
            assert.strictEqual(24, t.dump(new Bar))
        })

        it('uses #toJSON() if exists and no dump method given', () => {
            let t = new UnitClassT({class: Bar})
            assert.strictEqual(42, t.dump(new Bar))
        })

        it('stores spec.namespace as namespace property', () => {
            let t1 = new UnitClassT({class: Bar, namespace: 'foobar'}),
                t2 = new UnitClassT({class: Bar})
            assert.strictEqual('foobar', t1.namespace)
            assert.strictEqual(undefined, t2.namespace)
        })

        it('sets path property as `namespace.token` or just `token`', () => {
            let t1 = new UnitClassT({class: Bar, namespace: 'foobar'}),
                t2 = new UnitClassT({class: Bar})
            assert.strictEqual(t1.path, 'foobar.Bar')
            assert.strictEqual(t2.path, 'Bar')
        })

    })

})