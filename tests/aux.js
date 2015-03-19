

export class Foo {
    constructor() { }
    toString() { return '<foo>' }
}

export class Bar {
    constructor(arg1, arg2) {
        this.arg1 = arg1
        this.arg2 = arg2
    }
    toString() { return '<bar>' }
    toJSON() { return 42 }
    bar() { return 24 }
}

export function isFoo(x) { return x instanceof Foo }
export function fooEnc(x) { return null }
export function fooDec() { return new Foo() }

export function isBar(x) { return x instanceof Bar }
export function barEnc(x) { return null }
export function barDec() { return new Bar() }


export class Tree {
    constructor(val, children=[]) {
        this.val = val
        this.children = children.map((child) =>
            child instanceof Tree ? child : new Tree(child))
    }
    toString() {
        let val = this.val.toString(),
            children = this.children.map((c) => c.toString()).join(', ')
        return `Tree{ ${val}, [ ${children} ] }`
    }
}

export const fooSpec1 = {token: 'foo', class: Foo,   encode: fooEnc, decode: fooDec}
export const fooSpec2 = {token: 'foo', class: Foo,   encode: fooEnc}
export const fooSpec3 = {token: 'foo', pred:  isFoo, encode: fooEnc, decode: fooDec}
export const treeSpec = {
    token:  'tree',
    class:  Tree,
    encode: (tree) => ({val: tree.val, children: tree.children}),
    decode: (obj) => new Tree(obj.val, obj.children)
}

// export const fooT  = new Transformer([fooSpec1])
// export const treeT = new Transformer([fooSpec1, treeSpec])

export const foo   = new Foo
export const bar   = new Bar
export const tree  = new Tree(foo, [new Tree(foo)])

export const fooRepr  = {$Foo: null}
export const treeRepr = {$Tree: {
    val: {$Foo: null},
    children: [
        {$Tree: {
            val: {$Foo: null},
            children: []
        }}
    ]
}}