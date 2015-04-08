# Shaped
[![Code Climate](https://codeclimate.com/github/thaumant/shaped-js/badges/gpa.svg)](https://codeclimate.com/github/thaumant/shaped-js)
[![Test Coverage](https://codeclimate.com/github/thaumant/shaped-js/badges/coverage.svg)](https://codeclimate.com/github/thaumant/shaped-js)

Represent JS datatypes as JSON values, serialize to and restore from any format.

- [Features](#features)
- [Basic usage](#basic-usage)
- [Adding your types](#adding-your-types)
- [Reference](#reference)
    - [Options](#options)
        - [Serializer](#serializer)
        - [Prefix](#prefix)
    - [Specs](#specs)
        - [Class specs](#class-specs)
        - [Proto specs](#proto-specs)
        - [Predicate specs](#predicate-specs)
    - [Converter methods](#converter-methods)
        - [serialize()](#serialize)
        - [parse()](#parse)
        - [dump()](#dump)
        - [restore()](#restore)
        - [extendWith()](#extendwith)
        - [overrideBy()](#overrideby)
        - [withOptions()](#withoptions)


# Features
- Simple and readable way to serialize JS Date, RegExp, Buffer and ES6 types.
- Define transformers for your own types.
- Use JSON, BSON, YAML or any format you want.
- Performance optimized.


# Basic usage
```javascript
shaped.serialize(new Date); // returns '{"$Date":"2015-06-07T12:34:56.789Z"}'

shaped.parse('{"$Buffer":"Aw4P"}'); // returns <Buffer 03 0e 0f>
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
Dump and restore method are optional. So there is an minimal working spec for Date class:
```javascript
var spec = {class: Date};
```
Then extend Shaped (new converter will be created):
```javascript
var conv = shaped.extendWith([{class: Date}]);
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


# Reference

## Options
Type:
```
{
    serializer: (val: any): string,
    prefix: (serialized: string): any
}
```

### Serializer

### Prefix


## Specs

### Class specs
Type:
```
{
    class:      Constructor,
    token?:     string,
    namespace?: string,
    dump?:      string | (val: any): JSONValue,
    restore?:   (dumped: JSONValue): any
}
```
Class specs are objects describing how to represent and restore an instance of some class. Properties are following:

**spec#class**

A `class` property is a constructor function that will be used to match encoded value: for every instance of the class `spec.dump()` will be applied. It's `name` property is used when no token provided.

**spec#token**

Token is a main part for a key of a wrap object. For example, when token is 'Foo', then dumped and wrapped value looks like `{$Foo: dumped_value}`. When not provided, `class.name` is used. Must be unique in it's namespace.

**spec#namespace**

Namespace is an optional parameter that is used to hold some set of values together. It is used as a component for a key of a wrap object. For example, if token is 'Foo' and namespace is 'bar' then dumped and wrapped value looks like: `{$bar.Foo: dumped_value}`

**spec#dump**

This is a method that defines how value is represented in plain JSON values. Instead of function you may provide a string indicating a 'dump' method name. For example, when 'foo' is given, `dump` method is: `(val) => val.foo()`. If `dump` is not provided, 'toJSON' is used by default.

**spec#restore**

A method that defines how value is restored from JSON value. If not provided, then `(dumped) => new spec.class(dumped)` is used by default.

### Proto specs
Type:
```
{
    proto:      object,
    token:      string,
    namespace?: string,
    dump?:      string | (val: any): JSONValue,
    restore?:   (dumped: JSONValue): any
}
```

### Predicate specs
Type:
```
{
    pred:       (val: any): boolean,
    token:      string,
    namespace?: string,
    dump:       (val: any): JSONValue,
    restore:    (dumped: JSONValue): any
}
```

## Converter methods

### #serialize()()
Type: `(source: any): string`

Dump a value using `#dump()` and then stringify it using given serializer (JSON by default). All arguments are passed to `serializer#serialize()` with first argument dumped.

Example:
```
shaped.serialize(new Date) // returns '{"$Date":"2015-06-07T12:34:56.789Z"}'
```

### #parse()
Type: `(dumped: string): any`

Parse a value using given serializer (JSON by default) then restore it using `#restore()`. All arguments are passed to `serializer#parse()` with first argument restored.

Example:
```javascript
shaped.parse('{"$Date":"2015-06-07T12:34:56.789Z"}') // returns new instance of Date
```

### #dump()
Type: `(source: any): JSONValue`

This method is called in `#serialize()`, preparing a value for serialization from top to bottom. It does the following:
- finds appropriate spec (does not modify value if no spec found),
- calls `spec.dump()` method,
- recursively dumps each property or element of the dumped value,
- wraps result using prefix, token and namespace: `{$namespace.Token: dumped}`.

Example:
```javascript
shaped.dump(new Date) // returns object: {$Date: '2015-06-07T12:34:56.789Z'}
```

### #restore()
Type: `(dumped: JSONValue): any`

This method is called in `#parse()`, restoring source value from dumped form from bottom to top. It does the following:
- recursively restores each property or element of the dumped value,
- find appropriate spec using prefix, token and namespace (does not modify value if no spec found),
- unwraps the dumped value,
- calls `spec.restore()` on it.

Example:
```javascript
shaped.restore({$Date: '2015-06-07T12:34:56.789Z'}) // returns new instance of Date
```

### extendWith()
Type: `(conv: spec|spec[]|CompositeConv|CompositeConv[]): CompositeConv`

Creates new converter extending this with new convertible types. Throws an error when resulting spec list is inconsistent:
- when any class is in more than one class spec,
- when any prototype is in more then one proto spec,
- when there are two equal tokens in the same namespace.
Prefix and serializer are taken from the first converter.

Example:
```javascript
class Dummy {}
var conv = shaped.extendWith([{class: Dummy, dump: () => null}]);
conv.serialize(new Dummy); // returns '{"$Dummy": null}'
conv.parse('{"$Dummy": null}'); // returns new instance of Dummy
```

### #overrideBy()
Type: `(conv: spec|spec[]|CompositeConv|CompositeConv[]): CompositeConv`

Creates new converter, working as `#extendWith` but overrides former specs when the spec list becomes inconsistent.
Prefix and serializer are taken from the last converter.

Example:
```javascript
var conv = shaped.overrideBy([{
    class: Buffer,
    encode: "valueOf"
}]);
shaped.serialize(new Date); // returns '{"$Date":"2015-06-07T12:34:56.789Z"}'
conv.serialize(new Date);   // returns '{"$Date": 1433680496789}'
```

### #withOptions()
Type: `(options: options): CompositeConv`

Creates new converter with prefix or/and serializer changed.

Example:
```javascript
var conv = shaped.withOptions({prefix: '#'});
shaped.serialize(new Date); // returns '{"$Date":"2015-06-07T12:34:56.789Z"}'
conv.serialize(new Date);   // returns '{"#Date":"2015-06-07T12:34:56.789Z"}'
```
