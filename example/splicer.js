var Splicer = require('..')
var postcss = require('postcss')
var noop = function () {
  return function () {}
}
var A = postcss.plugin('A', noop)
var B = postcss.plugin('B', noop)
var C = postcss.plugin('C', noop)
var D = postcss.plugin('D', noop)
var E = postcss.plugin('E', noop)

var pipeline = Splicer([
  'a', [ A() ],
  'b', [ B() ],
  'c', [ postcss(C()) ],
  'd', [
    'a', [ A() ],
    'b', [ B() ],
  ],
])

console.log(
  pipeline.toProcessor()  // create a processor
  .plugins.map(getName)
)
// [ 'A', 'B', 'C', 'A', 'B' ]

pipeline.splice('c', 1) // delete C
console.log(
  pipeline.toProcessor().plugins.map(getName)
)
// [ 'A', 'B', 'A', 'B' ]

pipeline.get('d').splice('a', 0, D(), E())
console.log(
  pipeline.toProcessor().plugins.map(getName)
)
// [ 'A', 'B', 'D', 'E', 'A', 'B' ]

function getName(plugin) {
  return plugin.postcssPlugin
}

