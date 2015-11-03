var postcss = require('postcss')

module.exports = Pipeline

function Pipeline(processors) {
  if (!(this instanceof Pipeline)) {
    return new Pipeline(processors)
  }
  this.processors = []

  processors = (processors || []).map(function (processor, i) {
    if (typeof processor === 'string') {
      return
    }
    if (Array.isArray(processor)) {
      processor = new Pipeline(processor)
    }
    if (typeof processors[i - 1] === 'string') {
      processor.label = processors[i - 1]
    }
    return processor
  }).filter(Boolean)

  this.splice.apply(this, [0, 0].concat(processors))
}

Pipeline.prototype.indexOf = function(name) {
  if (typeof name === 'number') {
    return name
  }
  for (var i = 0, len = this.processors.length; i < len; ++i) {
    if (this.processors[i] === name || this.processors[i].label === name) {
      return i
    }
  }
  return -1
}

Pipeline.prototype.splice = function() {
  var args = [].slice.call(arguments)
  args[0] = this.indexOf(args[0])
  return this.processors.splice.apply(this.processors, args)
}

Pipeline.prototype.push = function() {
  return this.processors.push.apply(this.processors, arguments)
}

Pipeline.prototype.pop = function() {
  return this.processors.pop()
}

Pipeline.prototype.shift = function() {
  return this.processors.shift()
}

Pipeline.prototype.unshift = function() {
  return this.processors.unshift.apply(this.processors, arguments)
}

Pipeline.prototype.get = function(name) {
  var i = this.indexOf(name)
  return i === -1 ? undefined : this.processors[i]
}

Pipeline.prototype.toProcessor = function() {
  return postcss(this.processors.map(function (processor) {
    if (processor instanceof Pipeline) {
      return processor.toProcessor()
    }
    return processor
  }))
}

