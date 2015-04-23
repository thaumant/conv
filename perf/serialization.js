import {inspect} from 'util'
import {repeat, range, cloneDeep, extend} from 'lodash'
import conv from '../dist/conv'



let num = 13,
    shortString = 'foobar',
    longString = repeat('foobarbazqux', 10),
    smallObject = {
        foo: null,
        bar: 14,
        baz: 'foobar',
        qux: new Date,
        mux: Infinity
    },
    smallArray = range(10).map(() => cloneDeep(smallObject))

let bigObject = cloneDeep(smallObject)
extend(bigObject, {child11: cloneDeep(bigObject), child12: cloneDeep(bigObject)})
bigObject.child11.child22 = cloneDeep(bigObject)
bigObject.child12.child22 = cloneDeep(bigObject)

let bigArray = range(100).map(() => cloneDeep(bigObject))



suite('serializing numbers',  () => {
    bench('conv', () => { conv.serialize(num) })
    bench('JSON', () => { JSON.stringify(num) })
})


suite('serializing short strings',  () => {
    bench('conv', () => { conv.serialize(shortString) })
    bench('JSON', () => { JSON.stringify(shortString) })

})


suite('serializing long strings',  () => {
    bench('conv', () => { conv.serialize(longString) })
    bench('JSON', () => { JSON.stringify(longString) })
})


suite('serializing small objects', () => {
    bench('conv', () => { conv.serialize(smallObject) })
    bench('JSON', () => { JSON.stringify(smallObject) })
})


suite('serializing small arrays', () => {
    bench('conv', () => { conv.serialize(smallArray) })
    bench('JSON', () => { JSON.stringify(smallArray) })
})


suite('serializing big objects', () => {
    bench('conv', () => { conv.serialize(bigObject) })
    bench('JSON', () => { JSON.stringify(bigObject) })
})


suite('serializing big arrays', () => {
    bench('conv', () => { conv.serialize(bigArray) })
    bench('JSON', () => { JSON.stringify(bigArray) })
})
