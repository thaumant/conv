const assert = require('assert'),
    Transformer = require('../dist/Transformer')


function Foo() {}
function isFoo(x) { return x instanceof Foo }
function enc(x) { return null }
function dec() { return new Foo() }


describe('Transformer', () => {

    let spec1 = {token: 'foo', class: Foo, encode: enc, decode: dec},
        spec2 = {token: 'foo', class: Foo, encode: enc}


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

})
