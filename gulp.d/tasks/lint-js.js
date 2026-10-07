'use strict'

const eslint = require('gulp-eslint')
const vfs = require('vinyl-fs')

module.exports = function lintJsTask (files) {
  return function lintJs (done) {
    return vfs.src(files).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()).on('error', done)
  }
}
