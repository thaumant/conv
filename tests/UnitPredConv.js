import {assert} from 'chai'
import UnitPredConv from '../dist/UnitPredConv'
import {isFoo, fooRest, fooDump} from './aux'

describe('UnitPredConv', () => {

    describe('#validateSpec()', () => {

        let val = UnitPredConv.prototype.validateSpec.bind(UnitPredConv.prototype)

        it('passes when given instance of UnitPredConv', () => {
            assert.strictEqual(undefined, val(new UnitPredConv({token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest})))
        })

        it('calls UnitConv#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if token is not a valid string', () => {
            assert.strictEqual('missing token', val({pred: isFoo}))
            assert.strictEqual('invalid token', val({pred: isFoo, token: 2}))
            assert.strictEqual('invalid token', val({pred: isFoo, token: {}}))
            assert.strictEqual('invalid token', val({pred: isFoo, token: '$%^'}))
        })

        it('tells if predicate is not a function', () => {
            assert.strictEqual('invalid predicate for Foo', val({token: 'Foo', pred: 2}))
            assert.strictEqual('invalid predicate for Foo', val({token: 'Foo', pred: {}}))
        })

        it('tells if dump method is not a function', () => {
            assert.strictEqual('missing dump method for Foo', val({token: 'Foo', pred: isFoo}))
            assert.strictEqual('missing dump method for Foo', val({token: 'Foo', pred: isFoo, dump: 2}))
        })

        it('tells if restore method is not a function', () => {
            assert.strictEqual('missing restore method for Foo', val({token: 'Foo', pred: isFoo, dump: fooDump}))
            assert.strictEqual('missing restore method for Foo', val({token: 'Foo', pred: isFoo, dump: fooDump, restore: {}}))
        })

        it('tells if namespace is given and it is not a valid string', () => {
            assert.strictEqual('invalid namespace for Foo', val({pred: isFoo, token: 'Foo', namespace: 2}))
            assert.strictEqual('invalid namespace for Foo', val({pred: isFoo, token: 'Foo', namespace: {}}))
            assert.strictEqual('invalid namespace for Foo', val({pred: isFoo, token: 'Foo', namespace: '#$%'}))
        })

    })


    describe('#constructor()', () => {

        let spec1 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest, namespace: 'foobar'},
            spec2 = {token: 'Foo', pred: isFoo, dump: fooDump, restore: fooRest, namespace: null}

        let conv1 = new UnitPredConv(spec1)
        let conv2 = new UnitPredConv(spec2)

        it('validates spec with #validateSpec(), throwing it\'s messages as errors', () => {
            let test1 = () => new UnitPredConv({pred: isFoo}),
                test2 = () => new UnitPredConv({token: 'Foo', pred: isFoo})
            assert.throw(test1, 'Failed to create predicate converter: missing token')
            assert.throw(test2, 'Failed to create predicate converter: missing dump method for Foo')
        })

        it('stores spec.token as token property', () => {
            assert.strictEqual(spec1.token, conv1.token)
        })

        it('stores spec.pred as pred method', () => {
            assert.strictEqual(spec1.pred, conv1.pred)
        })

        it('stores spec.dump as dump method', () => {
            assert.strictEqual(spec1.dump, conv1.dump)
        })

        it('stores spec.restore as restore method', () => {
            assert.strictEqual(spec1.restore, conv1.restore)
        })

        it('stores spec.namespace as namespace property', () => {
            assert.strictEqual(conv1.namespace, spec1.namespace)
            assert.strictEqual(conv2.namespace, null)
        })

        it('sets path property as `namespace.token` or just `token`', () => {
            assert.strictEqual(conv1.path, spec1.namespace + '.' + spec1.token)
            assert.strictEqual(conv2.path, spec2.token)
        })

    })
})