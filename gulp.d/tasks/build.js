'use strict'

const autoprefixer = require('autoprefixer')
const browserify = require('browserify')
const concat = require('gulp-concat')
const cssnano = require('cssnano')
const fs = require('node:fs')
const { promises: fsp } = fs
const merge = require('merge-stream')
const ospath = require('node:path')
const path = ospath.posix
const postcss = require('gulp-postcss')
const postcssCalc = require('postcss-calc')
const postcssImport = require('postcss-import')
const postcssVar = require('postcss-custom-properties')
const postcssUrl = require('postcss-url')
const { Readable, Transform } = require('node:stream')
const { finished } = require('node:stream/promises')
function map (transform) {
  return new Transform({ objectMode: true, transform })
}
const replace = require('gulp-replace')
const through = () =>
  map(function passThrough (file, enc, next) {
    next(null, file)
  })
const uglify = require('gulp-uglify')
const vfs = require('vinyl-fs')
const git = require('git-rev-sync')
const svgoConfig = require('../lib/svgo-config')

module.exports = function buildTask (src, dest, preview) {
  return async function build () {
    const { default: imagemin, gifsicle, mozjpeg, optipng, svgo } = await import('gulp-imagemin')
    const opts = { base: src, cwd: src, encoding: false }
    const sourcemaps = preview || process.env.SOURCEMAPS === 'true'
    const postcssPlugins = [
      postcssImport,
      (css, { messages, opts: { file } }) =>
        Promise.all(
          messages
            .reduce((accum, { file: depPath, type }) => (type === 'dependency' ? accum.concat(depPath) : accum), [])
            .map((importedPath) => fsp.stat(importedPath).then(({ mtime }) => mtime))
        ).then((mtimes) => {
          bumpMtime(file.stat, newestMtime(mtimes, file.stat.mtime))
        }),
      postcssUrl([
        {
          filter: /^src\/css\/~[^/]*(?:font|face)[^/]*\/.*\/files\/.+\.(?:ttf|woff2?)$/,
          url: (asset) => {
            const relpath = asset.pathname.slice(1)
            const abspath = require.resolve(relpath)
            const basename = ospath.basename(abspath)
            const destpath = ospath.join(dest, 'font', basename)
            if (!fs.existsSync(destpath)) fs.cpSync(abspath, destpath, { recursive: true })
            return path.join('..', 'font', basename)
          },
        },
      ]),
      postcssVar({ preserve: true }),
      preview ? postcssCalc : () => {},
      autoprefixer,
      preview
        ? () => {}
        : (css, result) =>
            cssnano()
              .process(css, result.opts)
              .then(() => postcssPseudoElementFixer(css, result)),
    ]

    const output = merge(
      vfs
        .src('js/+([0-9])-*.js', { ...opts, read: false, sourcemaps })
        .pipe(bundle(opts))
        .pipe(uglify({ output: { comments: /^! / } }))
        // NOTE concat already uses stat from newest combined file
        .pipe(concat('js/site.js')),
      vfs
        .src('js/vendor/*([^.])?(.bundle).js', { ...opts, read: false })
        .pipe(bundle(opts))
        .pipe(uglify({ output: { comments: /^! / } })),
      vfs
        .src('js/vendor/*.min.js', opts)
        .pipe(map((file, enc, next) => next(null, Object.assign(file, { extname: '' }, { extname: '.js' })))),
      // mermaid.min.js is a global IIFE that browserify cannot bundle; copy it as-is.
      vfs.src(require.resolve('mermaid/dist/mermaid.min.js'), opts).pipe(concat('js/vendor/mermaid.js')),
      vfs
        .src(['css/site.css', 'css/vendor/*.css'], { ...opts, sourcemaps })
        .pipe(postcss((file) => ({ plugins: postcssPlugins, options: { file } }))),
      Readable.from(vfs.src('font/*.{ttf,woff*(2)}', opts)),
      vfs.src('img/**/*.{gif,ico,jpg,png,svg}', opts).pipe(
        preview
          ? through()
          : imagemin(
            [
              gifsicle(),
              mozjpeg(),
              optipng(),
              svgo(svgoConfig),
            ].reduce((accum, it) => (it ? accum.concat(it) : accum), [])
          )
      ),
      Readable.from(vfs.src('helpers/*.js', opts)),
      Readable.from(vfs.src('layouts/*.hbs', opts)),
      vfs.src('partials/*.hbs', opts).pipe(replace('@@antora-ui-version', uiVersion()))
    ).pipe(vfs.dest(dest, { sourcemaps: sourcemaps && '.', encoding: false }))
    await finished(output)
  }
}

function uiVersion () {
  try {
    return git.isTagDirty() ? git.long() : git.tag()
  } catch {
    return process.env.GITHUB_SHA || 'unknown'
  }
}

function newestMtime (mtimes, initial) {
  return new Date(Math.max(initial, ...mtimes))
}

function bumpMtime (stat, newest) {
  if (newest <= stat.mtime) return
  stat.mtime = newest
  stat.mtimeMs = newest.getTime()
}

function bundle ({ base: basedir, ext: bundleExt = '.bundle.js' }) {
  return map((file, enc, next) => {
    if (bundleExt && file.relative.endsWith(bundleExt)) {
      const mtimePromises = []
      const bundlePath = file.path
      browserify(file.relative, { basedir, detectGlobals: false })
        .plugin('browser-pack-flat/plugin')
        .on('file', (bundledPath) => {
          if (bundledPath !== bundlePath) mtimePromises.push(fsp.stat(bundledPath).then(({ mtime }) => mtime))
        })
        .bundle((bundleError, bundleBuffer) =>
          Promise.all(mtimePromises).then((mtimes) => {
            bumpMtime(file.stat, newestMtime(mtimes, file.stat.mtime))
            if (bundleBuffer !== undefined) file.contents = bundleBuffer
            next(bundleError, Object.assign(file, { path: file.path.slice(0, -bundleExt.length) + '.js' }))
          }, next)
        )
      return
    }
    fsp.readFile(file.path, 'UTF-8').then((contents) => {
      next(null, Object.assign(file, { contents: Buffer.from(contents) }))
    }, next)
  })
}

function postcssPseudoElementFixer (css, result) {
  css.walkRules(/(?:^|[^:]):(?:before|after)/, (rule) => {
    rule.selector = rule.selectors.map((it) => it.replace(/(^|[^:]):(before|after)$/, '$1::$2')).join(',')
  })
}
