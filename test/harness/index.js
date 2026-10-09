'use strict'

process.env.NODE_ENV = 'test'

const chai = require('chai')

chai.use(require('dirty-chai').default)

module.exports = { expect: chai.expect }
