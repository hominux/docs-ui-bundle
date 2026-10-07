'use strict'

const stylelint = require('gulp-stylelint')
const vfs = require('vinyl-fs')

module.exports = (files) =>
  function lintCss (done) {
    return vfs
      .src(files)
      .pipe(stylelint({ reporters: [{ formatter: 'string', console: true }], failAfterError: true }))
      .on('error', done)
  }
