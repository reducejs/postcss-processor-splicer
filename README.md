# postcss-processor-splicer
[![version](https://img.shields.io/npm/v/postcss-processor-splicer.svg)](https://www.npmjs.org/package/postcss-processor-splicer)
[![status](https://travis-ci.org/reducejs/postcss-processor-splicer.svg?branch=master)](https://travis-ci.org/reducejs/postcss-processor-splicer)
[![coverage](https://img.shields.io/coveralls/reducejs/postcss-processor-splicer.svg)](https://coveralls.io/github/reducejs/postcss-processor-splicer)
[![dependencies](https://david-dm.org/reducejs/postcss-processor-splicer.svg)](https://david-dm.org/reducejs/postcss-processor-splicer)
[![devDependencies](https://david-dm.org/reducejs/postcss-processor-splicer/dev-status.svg)](https://david-dm.org/reducejs/postcss-processor-splicer#info=devDependencies)
![node](https://img.shields.io/node/v/postcss-processor-splicer.svg)

Allow your postcss plugin pipeline to be modified like an array.

## Example

```javascript
var postcss = require('postcss')
var Pipeline = require('postcss-processor-splicer')

function createCreator(name) {
  return function (opts) {
    return function (root) {
      root.append( { selector: opts && opts.name || name } )
    }
  }
}

var A = postcss.plugin('A', createCreator('a'))
var B = postcss.plugin('B', createCreator('b'))
var C = postcss.plugin('C', createCreator('c'))
var D = postcss.plugin('D', createCreator('d'))

var pipeline = new Pipeline([
  A, // creator
  B(), // plugin
  postcss([C()]), // processor
  new Pipeline([[D, { name: 'd' }]]),  // pipeline
])

Promise.resolve()
  .then(function () {
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'apply all plugins: A, B, C, D'))
  })
  .then(function () {
    return pipeline.build('B', 'C')
      .process('x{}')
      .then(log.bind(null, 'apply plugins B, C with default options'))
  })
  .then(function () {
    return pipeline.build(['A', { name: '.a' }], ['D', { name: '.d' }])
      .process('x{}')
      .then(log.bind(null, 'apply plugins A, D with options (only valid for creators)'))
  })
  .then(function () {
    pipeline.splice('B', 2)
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'splice, delete B, C'))
  })
  .then(function () {
    pipeline.unshift(B())
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'unshift plugin B'))
  })
  .then(function () {
    pipeline.push(C)
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'push creator C'))
  })
  .then(function () {
    pipeline.get('C').push({ name: '.c' })
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'modify default options for creator C'))
  })
  .then(function () {
    pipeline.pop()
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'pop creator C'))
  })
  .then(function () {
    pipeline.shift()
    return pipeline.build()
      .process('x{}')
      .then(log.bind(null, 'shift plugin B'))
  })
  .catch(function (err) {
    console.log(err)
  })

function log(title, result) {
  console.log('\n')
  console.log('x'.repeat(40))
  console.log(title, ':')
  console.log(result.css)
}


```

output:

```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
apply all plugins: A, B, C, D :
x{}
a{}
b{}
c{}
d{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
apply plugins B, C with default options :
x{}
b{}
c{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
apply plugins A, D with options (only valid for creators) :
x{}
.a{}
.d{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
splice, delete B, C :
x{}
a{}
d{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
unshift plugin B :
x{}
b{}
a{}
d{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
push creator C :
x{}
b{}
a{}
d{}
c{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
modify default options for creator C :
x{}
b{}
a{}
d{}
.c{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
pop creator C :
x{}
b{}
a{}
d{}


xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
shift plugin B :
x{}
a{}
d{}


```

## pipeline = new Pipeline(creators)
Create a pipeline of creators.

### creators

Type: `Array`

Elements could be postcss plugins, postcss plugin creators, instances of Pipeline.
To set default options, just pass an array as the element.


### pipeline.[ArrayLikeMethods]
Modify the builtin creators.

`ArrayLikeMethods` could be one of the following:

* `splice`
* `push`
* `pop`
* `shift`
* `unshift`

### creator = pipeline.get(...postcssPlugin)
Get the internal representation of the creators according to the given plugin names or indexes.

#### creator
Representation of a creator.

Type: `Array`

The first element could be a postcss plugin function,
or postcss creator function (created with `postcss.plugin`).

Other elements are passed to the creator as options when build the plugin function.

#### postcssPlugin

Type: `String`, `Number`

Plugin name, or indexes in the pipeline.

### pipeline.build(...creators)

Create a postcss processor from given creators,
or creators in the pipeline.

You can use the plugin name or index to specify the plugin.
