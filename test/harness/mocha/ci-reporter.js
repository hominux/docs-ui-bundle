'use strict'

const { Base, Dot, XUnit } = require('mocha').reporters

// A Mocha reporter that combines the dot and xunit reporters.
class CI extends Base {
  constructor (runner, options) {
    super(runner, options)
    this.reporters = [new Dot(runner, options), new XUnit(runner, options)]
  }
}

module.exports = CI
