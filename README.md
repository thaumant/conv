# Shaped
[![Code Climate](https://codeclimate.com/github/thaumant/shaped-js/badges/gpa.svg)](https://codeclimate.com/github/thaumant/shaped-js)
[![Test Coverage](https://codeclimate.com/github/thaumant/shaped-js/badges/coverage.svg)](https://codeclimate.com/github/thaumant/shaped-js)

Represent JS datatypes as JSON values, serialize to and restore from any format.


## Features
- Simple and readable way to serialize JS Date, RegExp, Buffer and ES6 types.
- Define transformers for your own types.
- Use JSON, BSON, YAML or any format you want.
- Performance optimized.


## Why?
Because JSON is not sufficient. And because in big enough project you can never know what to expect in place of a date: unix date, js timestamp or a string, maybe ISO-formatted.

How does Shaped solves this? By extending the set of types you can serialize, standardizing the way of transmitting data.


## Usage
```
shaped.serialize(new Date); // returns '{"$Date":"2015-06-07T12:34:56.789Z"}'

shaped.parse('{"$Buffer":"Aw4P"}'); // returns <Buffer 03 0e 0f>
```
Following types are supported:
- Date,
- Buffer,
- ES6 Map,
- ES6 Set.
Last three are enabled only when found in the environment. For example, in node@0.10.* only Date and Buffer will be enabled, and in Chrome v41 you will get all but Buffer.


## Adding your types
To add a new class you must provide a **spec** - an object that describes rules for dumping a value in JSON values and restoring it back. There is a working spec for Date:
```
var spec = {
    class: Date,
    dump: (date) => date.toJSON(),
    restore: (str) => new Date(str)
};
```
Dump and restore method are optional. So there is an minimal working spec for Date class:
```
var spec = {class: Date};
```
Then extend Shaped (new converter will be created):
```
var conv = shaped.extendWith([{class: Date}]);
```
When you are defining converters for domain-specific types, use namespaces. There is a more elaborate example:
```
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

var conv = shaped.extendWith([{
    class: User,
    namespace: 'mycompany'
    // user.toJSON() as dump() will be used by default
    // new User(dumped) as restore() will be used by default
}]);

var user = new User({id: 13, name: "John"});

console.log(conv.serialize(user, null, 4)) // args are passed to JSON.stringify
/* prints:
{
    "$mycompany.User": {
        "id": 12
        "name": "John"
    }
}
*/
```

Gotchas:
- In `dump` method don't wrap the result in `{$Constructor: result}`, Shaped will do that for you. 
- Do not transform properties of the dumped value, Shaped will do that recursively after calling `spec.dump()` on source value. Dump works from top to bottom.
- Restore works in the opposite direction: when `spec.restore()` is called, it's argument properties are already restored.

There are three kinds of specs: class, proto and predicate specs. See reference for more info and **shaped-immutable** for more examples.

### Class specs
Class specs are objects defining how to represent and restore an instance of some class. Properties are following:

#### spec.class (string, required)
A `class` property is a constructor function that will be used to match encoded value: for every instance of the class `spec.dump()` will be applied. It's `name` property is used when no token provided.

#### spec.token (string, optional)
Token is a main part for a key of a wrap object. For example, when token is 'Foo', then dumped and wrapped value looks like `{$Foo: dumped_value}`. When not provided, `class.name` is used. Must be unique in it's namespace.

#### spec.namespace (string, optional)
Namespace is an optional parameter that is used to hold some set of values together. It is used as a component for a key of a wrap object. For example, if token is 'Foo' and namespace is 'bar' then dumped and wrapped value looks like: `{$bar.Foo: dumped_value}`

#### spec.dump (function|string, optional):
This is a method that defines how value is represented in plain JSON values. Instead of function you may provide a string indicating a 'dump' method name. For example, when 'foo' is given, `dump` method is: `(val) => val.foo()`. If `dump` is not provided, 'toJSON' is used by default.


#### restore (function, optional):
A method that defines how value is restored from JSON value. If not provided, then `(dumped) => new spec.class(dumped)` is used by default.

### Proto specs
### Predicate specs


## Gotchas


## Options

### Serializer

### Prefix


## Reference

### #dump()
Traverse given structure, for each value finding appropriate spec, calling it's `dump` method and then wrapping it, then continuing recursively.

### #restore()
Traverse given structure recursively, when wrap occurs, use it's key to find appropriate spec and calling spec's `restore` method to restore the value.

### #serialize()

### #parse()

### #restoreUnsafe()

### #extendWith()

### #overrideBy()

### #withOptions()