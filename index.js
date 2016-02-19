'use strict'

const postcss = require('postcss')

class Pipeline {
  constructor(creators) {
    this.creators = []
    this.splice.apply(this, [0, 0].concat(creators || []))
  }

  build() {
    if (arguments.length === 0) {
      return build(this.creators)
    }
    var creators = []
    ;[].forEach.call(arguments, function (creator) {
      if (
        typeof creator === 'string' ||
        typeof creator === 'number'
      ) {
        creator = this.get(creator)
      }
      creators.push.apply(creators, this.normalize(creator))
    }, this)

    return build(creators)
  }

  get(i) {
    if (arguments.length < 1) {
      return null
    }
    if (arguments.length === 1) {
      i = this.indexOf(i)
      return i === -1 ? null : this.creators[i]
    }
    return [].map.call(arguments, function (n) {
      return this.get(n)
    }, this)
  }

  indexOf(i) {
    if (typeof i === 'number') {
      return i
    }
    for (var j = 0, len = this.creators.length; j < len; ++j) {
      if (equal(this.creators[j][0], i)) {
        return j
      }
    }
    return -1
  }

  splice() {
    var args = []

    ;[].forEach.call(arguments, function (creator, i) {
      if (i === 0) {
        return args.push(this.indexOf(creator))
      }
      if (i === 1) {
        return args.push(creator)
      }
      args.push.apply(args, this.normalize(creator))
    }, this)

    return this.creators.splice.apply(this.creators, args)
  }

  push() {
    var args = [this.creators.length, 0]
    args.push.apply(args, arguments)
    this.splice.apply(this, args)
  }

  unshift() {
    var args = [0, 0]
    args.push.apply(args, arguments)
    this.splice.apply(this, args)
  }

  pop() {
    return this.creators.pop()
  }

  shift() {
    return this.creators.shift()
  }

  normalize(creator) {
    if (creator && creator.creators) {
      // Pipeline instance
      return creator.creators
    }
    if (creator && creator.plugins) {
      // postcss Processor instance
      return creator.plugins.map(function (plugin) {
        return [ plugin ]
      })
    }
    if (!Array.isArray(creator)) {
      creator = [ creator ]
    }
    if (typeof creator[0] === 'function') {
      return [ creator ]
    }
    var crt = this.get(creator[0])
    if (!crt) {
      return []
    }
    crt = crt.slice()
    crt.splice.apply(crt, [1, 0].concat(creator.slice(1)))
    return [ crt ]
  }
}

function equal(creator, p) {
  return p === creator ||
    p === creator.postcssPlugin ||
    creator.postcss && p === creator.postcss.postcssPlugin
}

function build(creators) {
  return postcss(creators.map(function (creator) {
    if (!creator[0].postcss) {
      // already plugin function, not creator anymore
      return creator[0]
    }
    return creator[0].apply(null, creator.slice(1))
  }))
}

module.exports = Pipeline
module.exports.build = build

