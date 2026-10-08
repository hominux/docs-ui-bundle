'use strict'

const eslint = require('gulp-eslint-new')
const vfs = require('vinyl-fs')

module.exports = function formatTask (files) {
  return function format () {
    return vfs
      .src(files)
      .pipe(eslint({ fix: true }))
      .pipe(eslint.fix())
      .pipe(vfs.dest((file) => file.base))
  }
}
