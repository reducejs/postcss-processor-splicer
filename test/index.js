var Pipeline = require('..')
var test = require('tape')
var postcss = require('postcss')

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
var D = postcss.plugin('D', createCreator('D'))

test('empty', function(t) {
  var pipeline = new Pipeline()
  t.same(pipeline.creators, [])
  t.end()
})

test('normalize', function(t) {
  var pipeline = Pipeline([A, null, [B, { x: 1 }]])
  t.same(pipeline.creators, [ [A], [B, { x: 1 }] ])
  t.end()
})

test('build', function(t) {
  var pipeline = Pipeline([
    A, // creator
    B(), // plugin
    postcss([C()]), // processor
    Pipeline([[D, { name: 'd' }]]),  // pipeline
  ])

  return Promise.all([
    pipeline.build().process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\na{}\nb{}\nc{}\nd{}', 'this.creators')
    }),

    pipeline.build('B').process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}', 'name')
    }),

    pipeline.build(['A', { name: 'A' }]).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nA{}', 'name with options')
    }),

    pipeline.build(B()).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}', 'plugin')
    }),

    pipeline.build(postcss(B())).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}', 'processor')
    }),

    pipeline.build(Pipeline([B])).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}', 'pipeline')
    }),

    pipeline.build('B', 'D').process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}\nd{}', 'multiple names')
    }),

    pipeline.build(A, 'B').process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\na{}\nb{}', 'name and plugin function')
    }),

    pipeline.build('B', [D, { name: 'd' }]).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}\nd{}', 'name and plugin function with options')
    }),

    pipeline.build('B', ['D', { name: 'D' }]).process('x{}').then(function (result) {
      t.equal(result.css, 'x{}\nb{}\nD{}', 'name and name with options')
    }),
  ])
})

test('indexOf', function(t) {
  var pipeline = Pipeline([A, B])
  t.equal(pipeline.indexOf(1), 1, 'numeric input')
  t.equal(pipeline.indexOf('B'), 1, 'string input')
  t.equal(pipeline.indexOf(B), 1, 'creator input')
  t.equal(pipeline.indexOf('C'), -1, 'non-existing name')
  t.equal(pipeline.indexOf(C), -1, 'non-existing creator')
  t.end()
})

test('get', function(t) {
  var pipeline = Pipeline([A, B])
  t.same(pipeline.get(), null, 'nothing')
  t.same(pipeline.get(1), [ B ], 'single')
  t.same(pipeline.get(1, 0), [ [B], [A] ], 'multiple, arguments')

  var p = pipeline.get(1)
  t.same(p, [ B ], 'without options')
  p.push({ x: 1 })
  t.same(pipeline.get('B'), [ B, { x: 1 } ], 'with options')
  t.same(pipeline.get('C'), null, 'non-existing name')
  t.end()
})

test('push', function(t) {
  t.plan(1)
  var pipeline = Pipeline([A, B])
  pipeline.push(C)
  pipeline.build().process('x{}').then(function (result) {
    t.equal(result.css, 'x{}\na{}\nb{}\nc{}')
  })
})

test('pop', function(t) {
  t.plan(1)
  var pipeline = Pipeline([A, B, C])
  pipeline.pop()
  pipeline.build().process('x{}').then(function (result) {
    t.equal(result.css, 'x{}\na{}\nb{}')
  })
})

test('shift', function(t) {
  t.plan(1)
  var pipeline = Pipeline([A, B, C])
  pipeline.shift()
  pipeline.build().process('x{}').then(function (result) {
    t.equal(result.css, 'x{}\nb{}\nc{}')
  })
})

test('unshift', function(t) {
  t.plan(1)
  var pipeline = Pipeline([B, C])
  pipeline.unshift(A)
  pipeline.build().process('x{}').then(function (result) {
    t.equal(result.css, 'x{}\na{}\nb{}\nc{}')
  })
})

test('splice', function(t) {
  var pipeline = Pipeline([A, B, C])

  return Promise.resolve()
    .then(function () {
      pipeline.splice('B', 1)
      return pipeline.build().process('x{}')
        .then(function (result) {
          t.equal(result.css, 'x{}\na{}\nc{}', 'delete middle plugins')
        })
    })
    .then(function () {
      pipeline.splice('C', 0, B)
      return pipeline.build().process('x{}')
        .then(function (result) {
          t.equal(result.css, 'x{}\na{}\nb{}\nc{}', 'insert middle plugins')
        })
    })
    .then(function () {
      pipeline.splice('A', 2)
      return pipeline.build().process('x{}')
        .then(function (result) {
          t.equal(result.css, 'x{}\nc{}', 'delete multiple plugins')
        })
    })
    .then(function () {
      pipeline.splice('C', 0, A, B)
      return pipeline.build().process('x{}')
        .then(function (result) {
          t.equal(result.css, 'x{}\na{}\nb{}\nc{}', 'insert multiple plugins')
        })
    })
    .then(function () {
      pipeline.splice('B', 2, C, B)
      return pipeline.build().process('x{}')
        .then(function (result) {
          t.equal(result.css, 'x{}\na{}\nc{}\nb{}', 'delete and insert')
        })
    })
})

