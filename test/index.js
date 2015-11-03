var test = require('tape')
var Splicer = require('..')
var postcss = require('postcss')

var noop = function () {
  return function () {}
}

var A = postcss.plugin('A', noop)
var B = postcss.plugin('B', noop)
var C = postcss(postcss(A()))
var E = postcss.plugin('E', noop)

test('splice', function(t) {
  var pipeline = Splicer([
    'a', [ A() ],
    'b', [ B() ],
    'c', [
      'b', [ B() ],
      'a', [ A(), E() ],
    ],
  ])
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['A', 'B', 'B', 'A', 'E'],
    'constructor'
  )

  pipeline.splice('b', 1)
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['A', 'B', 'A', 'E'],
    'remove'
  )

  pipeline.splice('c', 0, E(), C)
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['A', 'E', 'A', 'B', 'A', 'E'],
    'add'
  )

  t.end()
})

test('more', function(t) {
  var pipeline = Splicer([
    'a', [ A() ],
    'b', B(),
    'c', [
      'b', [ B() ],
      'a', [ A(), E() ],
    ],
  ])
  t.same(
    getName(pipeline.get('b')),
    'B',
    'get non pipeline'
  )

  pipeline.get('c').get('b').push(E())
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['A', 'B', 'B', 'E', 'A', 'E'],
    'get pipeline'
  )

  pipeline.shift()
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['B', 'B', 'E', 'A', 'E'],
    'shift'
  )
  t.equal(pipeline.indexOf('a'), -1, 'indexOf deleted shift')
  t.equal(pipeline.get('a'), undefined, 'get deleted shift')

  var b = Splicer([B()])
  b.label = 'bb'
  pipeline.unshift(b)
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['B', 'B', 'B', 'E', 'A', 'E'],
    'unshift pipeline'
  )
  t.same(
    pipeline.get('bb').toProcessor().plugins.map(getName),
    ['B'],
    'get inserted pipeline'
  )

  var poped = pipeline.pop()
  t.same(
    pipeline.toProcessor().plugins.map(getName),
    ['B', 'B'],
    'pop'
  )
  t.same(
    poped.toProcessor().plugins.map(getName),
    ['B', 'E', 'A', 'E'],
    'pop results'
  )

  t.end()
})

function getName(plugin) {
  return plugin.postcssPlugin
}

