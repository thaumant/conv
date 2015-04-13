# Conv [![Coverage Status](https://coveralls.io/repos/thaumant/conv/badge.svg?branch=master)](https://coveralls.io/r/thaumant/conv?branch=master) [![Build Status](https://travis-ci.org/thaumant/conv.svg?branch=master)](https://travis-ci.org/thaumant/conv)

Represent JS datatypes as JSON values, serialize to and restore from any format.

- [Features](#features)
- [Basic usage](#basic-usage)
- [Adding your types](#adding-your-types)
- [Gotchas](#gotchas)
- [Documentation](#documentation)


# Features
- Simple and readable way to serialize JS Date, RegExp, Buffer and ES6 types.
- Define converters for your own types.
- Use JSON, BSON, YAML or any format you want.
- Converters composition with consistency checks included.
- Performance optimized, no dependencies.


# Basic usage
```javascript
conv.parse('{"$Buffer":"Aw4P"}'); // returns <Buffer 03 0e 0f>

console.log(conv.serialize(new Date, null, 4));
/* arguments are passed to JSON.stringify, so it prints:
{
    "$Date": "2015-06-07T12:34:56.789Z"
}
*/
```
Following types are supported:
- Date,
- Buffer,
- ES6 Map,
- ES6 Set.

Last three are enabled only when found in the environment. For example, in node v0.10 only Date and Buffer will be enabled, and in Chrome v41 you will get all but Buffer.


# Adding your types
To add a new class you must provide a **spec** - an object that describes rules for dumping a value in JSON values and restoring it back. There is a working spec for Date:
```javascript
var spec = {
    class: Date,
    dump: (date) => date.toJSON(),
    restore: (str) => new Date(str)
};
```
Dump and restore method are optional. So there is a minimal working spec for Date class:
```javascript
var spec = {class: Date};
```
Make new extended converter using the spec:
```javascript
var conv = conv.extendWith([{class: Date}]);
```
When you are defining converters for domain-specific types, use namespaces. There is a more elaborate example:
```javascript
class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
    }
    toJSON() {
        return {id: this.id, name: this.name};
    }
    // ...
}

var conv = conv.extendWith([{
    class: User,
    namespace: 'mycompany'
    // user.toJSON() as dump() will be used by default
    // new User(dumped) as restore() will be used by default
}]);

var user = new User({id: 13, name: "John"});

console.log(conv.serialize(user, null, 4))
/* prints:
{
    "$mycompany.User": {
        "id": 12
        "name": "John"
    }
}
*/
```

There are three kinds of specs: class, proto and predicate specs. See [documentation](../../wiki) for more info.

# Gotchas

- In `dump` method don't wrap the result in `{$Constructor: result}`, Conv will do that for you.
- Do not transform properties of the dumped value, Conv will do that recursively after calling `spec.dump()` on source value. Dump works from top to bottom.
- Restore works in the opposite direction: when dumped object is passed to `spec.restore()`, it's properties are already restored.
- Check your spec: in almost all cases `val` should be equal `spec.restore(spec.dump(val))`, as well as `dumped` shold be equal `spec.dump(spec.restore(dumped))`.

# Documentation
See the [wiki](../../wiki) for documentation and **conv-immutable** for more examples.
