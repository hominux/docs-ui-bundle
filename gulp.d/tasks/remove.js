'use strict'

const { promises: fsp } = require('node:fs')
const { Transform } = require('node:stream')
const map = (transform) => new Transform({ objectMode: true, transform })
const vfs = require('vinyl-fs')

module.exports = function removeTask (files) {
  return function remove () {
    return vfs.src(files, { allowEmpty: true }).pipe(map(({ path }, enc, next) => rm(path, next)))
  }
}

function rm (path, cb) {
  return fsp.rm(path, { recursive: true }).then(cb).catch(cb)
}
