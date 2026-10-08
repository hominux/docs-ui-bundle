'use strict'

const stylelint = require('stylelint')

module.exports = function lintCssTask (files) {
  return async function lintCss () {
    const { report, errored } = await stylelint.lint({ files, formatter: 'string' })
    if (report) console.log(report)
    if (errored) throw new Error('stylelint found errors')
  }
}
