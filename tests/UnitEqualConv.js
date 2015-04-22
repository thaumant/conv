import {assert} from 'chai'
import UnitEqualConv from '../dist/UnitEqualConv'
import {isFoo, fooRest, fooDump} from './aux'


function toNull() { return null }


describe('UnitEqualConv', () => {

    describe('#validateSpec()', () => {

        let val = UnitEqualConv.prototype.validateSpec.bind(UnitEqualConv.prototype)

        it('passes when given instance of UnitEqualConv', () => {
            assert.strictEqual(undefined, val(new UnitEqualConv({token: 'Null', value: null, dump: toNull, restore: toNull})))
        })

        it('calls UnitConv#validateSpec() at first', () => {
            assert.strictEqual('spec is not a plain object', val([]))
        })

        it('tells if token is not a valid string', () => {
            assert.strictEqual('missing token', val({value: null}))
            assert.strictEqual('invalid token', val({value: null, token: 2}))
            assert.strictEqual('invalid token', val({value: null, token: {}}))
            assert.strictEqual('invalid token', val({value: null, token: '$%^'}))
        })

        it('tells if namespace is given and it is not a valid string', () => {
            assert.strictEqual('invalid namespace for Null', val({value: null, token: 'Null', namespace: 2}))
            assert.strictEqual('invalid namespace for Null', val({value: null, token: 'Null', namespace: {}}))
            assert.strictEqual('invalid namespace for Null', val({value: null, token: 'Null', namespace: '#$%'}))
        })

    })


    describe('#constructor()', () => {

        let spec1 = {token: 'Null', value: null, dump: toNull, restore: toNull, namespace: 'foobar'},
            spec2 = {token: 'Null', value: null, dump: toNull, restore: toNull, namespace: null}

        let conv1 = new UnitEqualConv(spec1)
        let conv2 = new UnitEqualConv(spec2)

        it('validates spec with #validateSpec(), throwing it\'s messages as errors', () => {
            let test = () => new UnitEqualConv({value: null})
            assert.throw(test, 'Failed to create equality converter: missing token')
        })

        it('stores spec.token as token property', () => {
            assert.strictEqual(spec1.token, conv1.token)
        })

        it('stores spec.value as value property', () => {
            assert.strictEqual(spec1.value, conv1.value)
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