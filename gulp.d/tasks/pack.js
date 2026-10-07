'use strict'

const vfs = require('vinyl-fs')
const zip = require('gulp-vinyl-zip')
const path = require('node:path')

module.exports = (src, dest, bundleName, onFinish) =>
  function pack () {
    return vfs
      .src('**/*', { base: src, cwd: src })
      .pipe(zip.dest(path.join(dest, `${bundleName}-bundle.zip`)))
      .on('finish', () => onFinish?.(path.resolve(dest, `${bundleName}-bundle.zip`)))
  }
