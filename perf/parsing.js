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
        qux: {$Date: '2015-04-23T17:11:48.926Z'},
        mux: {$PosInfinity: null}
    },
    smallArray = range(10).map(() => cloneDeep(smallObject))

let bigObject = cloneDeep(smallObject)
extend(bigObject, {child11: cloneDeep(bigObject), child12: cloneDeep(bigObject)})
bigObject.child11.child22 = cloneDeep(bigObject)
bigObject.child12.child22 = cloneDeep(bigObject)

let bigArray = range(100).map(() => cloneDeep(bigObject))

num         = JSON.stringify(num)
shortString = JSON.stringify(shortString)
longString  = JSON.stringify(longString)
smallObject = JSON.stringify(smallObject)
smallArray  = JSON.stringify(smallArray)
bigObject   = JSON.stringify(bigObject)
bigArray    = JSON.stringify(bigArray)



suite('parsing numbers',  () => {
    bench('conv', () => { conv.parse(num) })
    bench('JSON', () => { JSON.parse(num) })
})


suite('parsing short strings',  () => {
    bench('conv', () => { conv.parse(shortString) })
    bench('JSON', () => { JSON.parse(shortString) })

})


suite('parsing long strings',  () => {
    bench('conv', () => { conv.parse(longString) })
    bench('JSON', () => { JSON.parse(longString) })
})


suite('parsing small objects', () => {
    bench('conv', () => { conv.parse(smallObject) })
    bench('JSON', () => { JSON.parse(smallObject) })
})


suite('parsing small arrays', () => {
    bench('conv', () => { conv.parse(smallArray) })
    bench('JSON', () => { JSON.parse(smallArray) })
})


suite('parsing big objects', () => {
    bench('conv', () => { conv.parse(bigObject) })
    bench('JSON', () => { JSON.parse(bigObject) })
})


suite('parsing big arrays', () => {
    bench('conv', () => { conv.parse(bigArray) })
    bench('JSON', () => { JSON.parse(bigArray) })
})
