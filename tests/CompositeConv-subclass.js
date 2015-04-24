import {assert} from 'chai'
import CompositeConv from '../dist/CompositeConv'
import UnitPredConv from '../dist/UnitPredConv'
import UnitClassConv from '../dist/UnitClassConv'
import {Foo, isFoo, fooDump, fooRest, foo, Bar, bar, barDump} from './aux'


describe('CompositeConv (subclassing)', () => {

    class ConvSubclass extends CompositeConv {
        foo() {
            return 'bar'
        }
    }

    let fooSpec = {
            class: Foo,
            dump: () => null
        },
        barSpec = {
            class: Bar
        }

    describe('#constructor()', () => {

        it('creates working composite converter', () => {
            let conv = new ConvSubclass([fooSpec, barSpec])
            assert.lengthOf(conv.classConvs, 2)
            assert.deepEqual({$Foo: null}, conv.dump(foo))
        })

        it('applies the same validation as parent class', () => {
            let test = () => new ConvSubclass([{}])
            assert.throw(test, 'Invalid spec, no class, prototype or predicate')
        })

    })

    describe('#extendWith()', () => {

        it('returns new instance of the subclass', () => {
            let conv1 = new ConvSubclass([fooSpec]),
                conv2 = conv1.extendWith([barSpec])

            assert.instanceOf(conv2, ConvSubclass)
            assert.notEqual(conv1, conv2)
            assert.lengthOf(conv2.classConvs, 2)
            assert.deepEqual({$Bar: 42}, conv2.dump(bar))
        })

    })

    describe('#overrideBy()', () => {

        it('returns new instance of the subclass', () => {
            let conv1 = new ConvSubclass([barSpec]),
                conv2 = conv1.overrideBy([{class: Bar, dump: () => null}])

            assert.instanceOf(conv2, ConvSubclass)
            assert.notEqual(conv1, conv2)
            assert.lengthOf(conv2.classConvs, 1)
            assert.deepEqual({$Bar: null}, conv2.dump(bar))
        })

    })

    describe('#withOptions()', () => {

        it('returns new instance of the subclass', () => {
            let conv1 = new ConvSubclass([barSpec]),
                conv2 = conv1.withOptions({prefix: '#'})

            assert.instanceOf(conv2, ConvSubclass)
            assert.notEqual(conv1, conv2)
            assert.deepEqual({'#Bar': 42}, conv2.dump(bar))
        })

    })

    describe('#exclude()', () => {

        it('returns new instance of the subclass', () => {
            let conv1 = new ConvSubclass([fooSpec, barSpec]),
                conv2 = conv1.exclude({class: Bar})

            assert.instanceOf(conv2, ConvSubclass)
            assert.notEqual(conv1, conv2)
            assert.lengthOf(conv2.classConvs, 1)
            assert.strictEqual(conv2.classConvs[0].class, Foo)
        })

    })

})