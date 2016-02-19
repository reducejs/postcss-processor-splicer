var postcss = require('postcss')
var Pipeline = require('..')

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

