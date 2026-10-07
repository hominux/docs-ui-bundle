'use strict'

const autoprefixer = require('autoprefixer')
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const concat = require('gulp-concat')
const cssnano = require('cssnano')
const fs = require('fs-extra')
const merge = require('../lib/merge-streams')
const ospath = require('node:path')
const path = ospath.posix
const postcss = require('gulp-postcss')
const postcssCalc = require('postcss-calc')
const postcssImport = require('postcss-import')
const postcssUrl = require('postcss-url')
const postcssVar = require('postcss-custom-properties')
const tailwindcss = require('@tailwindcss/postcss')
const { Readable, Transform } = require('node:stream')
const map = (transform) => new Transform({ objectMode: true, transform })
const through = () => map((file, enc, next) => next(null, file))
const terser = require('gulp-terser')
const vfs = require('vinyl-fs')

module.exports = function build (src, dest, preview) {
  return () => run(src, dest, preview)
}

function run (src, dest, preview) {
  const opts = { base: src, cwd: src }
  const binaryOpts = { ...opts, encoding: false }
  const sourcemaps = preview || process.env.SOURCEMAPS === 'true'
  const postcssPlugins = [
    postcssImport,
    tailwindcss,
    (css, { messages, opts: { file } }) =>
      Promise.all(
        messages
          .reduce((accum, { file: depPath, type }) => (type === 'dependency' ? accum.concat(depPath) : accum), [])
          .map((importedPath) => fs.stat(importedPath).then(({ mtime }) => mtime))
      ).then((mtimes) => bumpMtime(file, mtimes)),
    postcssUrl([
      {
        filter: /^src\/css\/~[^/]*(?:font|face)[^/]*\/.*\/files\/.+\.(?:ttf|woff2?)$/,
        url: (asset) => {
          const relpath = asset.pathname.slice(1)
          const abspath = require.resolve(relpath)
          const basename = ospath.basename(abspath)
          const destpath = ospath.join(dest, 'font', basename)
          if (!fs.pathExistsSync(destpath)) fs.copySync(abspath, destpath)
          return path.join('..', 'font', basename)
        },
      },
    ]),
    postcssVar({ preserve: preview }),
    preview ? postcssCalc : () => {},
    autoprefixer,
    preview ? () => {} : cssnano({ preset: 'default' }),
    preview ? () => {} : postcssPseudoElementFixer(),
  ]

  // mermaid's dist is a global IIFE that breaks inside a browserify module wrapper, so it is prepended as-is.
  const mermaidDist = fs.readFileSync(require.resolve('mermaid/dist/mermaid.min.js'))
  const withMermaid = (bundleBuffer) => Buffer.concat([mermaidDist, Buffer.from(';\n'), bundleBuffer])
  // see https://gulpjs.org/recipes/browserify-multiple-destination.html
  const vendorBundles = map((file, enc, next) =>
    file.relative.endsWith('.bundle.js') ? bundleVendor(file, src, withMermaid, next) : readVendor(file, next)
  )
  const merged = merge(
    vfs
      .src('js/+([0-9])-*.js', { ...opts, sourcemaps })
      .pipe(terser())
      // NOTE concat already uses stat from newest combined file
      .pipe(concat('js/site.js')),
    vfs
      .src('js/vendor/*([^.])?(.bundle).js', { ...opts, read: false })
      .pipe(vendorBundles)
      .pipe(buffer())
      .pipe(terser()),
    vfs
      .src('js/vendor/*.min.js', opts)
      .pipe(map((file, enc, next) => next(null, Object.assign(file, { extname: '' }, { extname: '.js' })))),
    // NOTE use this statement to bundle a JavaScript library that cannot be browserified, like jQuery
    //vfs.src(require.resolve('<package-name-or-require-path>'), opts).pipe(concat('js/vendor/<library-name>.js')),
    vfs
      .src(['css/site.css', 'css/search.css', 'css/vendor/*.css'], { ...opts, sourcemaps })
      .pipe(postcss((file) => ({ plugins: postcssPlugins, options: { file } }))),
    fs.pathExistsSync(ospath.join(src, 'font')) ? vfs.src('font/*.{ttf,woff*(2)}', binaryOpts) : Readable.from([]),
    vfs.src('img/**/*.{gif,ico,jpg,png,svg}', binaryOpts).pipe(
      preview ? through() : optimizeImages()
    ),
    vfs.src('helpers/*.js', opts),
    vfs.src('layouts/*.hbs', opts),
    vfs.src('partials/*.hbs', opts)
  )
  vendorBundles.on('error', (err) => merged.destroy(err))
  const out = merged.pipe(vfs.dest(dest, { sourcemaps: sourcemaps && '.' }))
  merged.on('error', (err) => out.destroy(err))
  return out
}

function bumpMtime (file, mtimes) {
  const newest = new Date(Math.max(file.stat.mtime, ...mtimes))
  if (newest > file.stat.mtime) {
    file.stat.mtime = newest
    file.stat.mtimeMs = +newest
  }
}

function bundleVendor (file, src, withMermaid, next) {
  const mtimePromises = []
  const bundlePath = file.path
  const isMermaid = /mermaid/.test(file.relative)
  const bundler = browserify(file.relative, { basedir: src, detectGlobals: false })
  bundler.plugin('browser-pack-flat/plugin')
  bundler
    .on('file', (bundledPath) => {
      if (bundledPath !== bundlePath) mtimePromises.push(fs.stat(bundledPath).then(({ mtime }) => mtime))
    })
    .bundle((bundleError, bundleBuffer) =>
      Promise.all(mtimePromises).then((mtimes) => {
        bumpMtime(file, mtimes)
        if (bundleBuffer !== undefined) file.contents = isMermaid ? withMermaid(bundleBuffer) : bundleBuffer
        file.path = file.path.slice(0, file.path.length - 10) + '.js'
        next(bundleError, file)
      })
    )
}

function readVendor (file, next) {
  fs.readFile(file.path, 'UTF-8').then((contents) => {
    file.contents = Buffer.from(contents)
    next(null, file)
  })
}

function optimizeImages () {
  return map((file, enc, next) =>
    import('gulp-imagemin').then(({ default: imagemin, gifsicle, mozjpeg, optipng, svgo }) => {
      const svgoPlugins = [
        {
          name: 'preset-default',
          params: {
            overrides: { cleanupIds: { preservePrefixes: ['icon-', 'view-'] }, removeViewBox: false, removeDesc: false },
          },
        },
      ]
      const stream = imagemin([gifsicle(), mozjpeg(), optipng(), svgo({ plugins: svgoPlugins })], { silent: true })
      stream.on('data', (optimized) => next(null, optimized)).on('error', next)
      stream.end(file)
    }, next)
  )
}

function postcssPseudoElementFixer () {
  return {
    postcssPlugin: 'pseudo-element-fixer',
    OnceExit (css) {
      css.walkRules(/(?:^|[^:]):(?:before|after)/, (rule) => {
        rule.selector = rule.selectors.map((it) => it.replace(/(^|[^:]):(before|after)$/, '$1::$2')).join(',')
      })
    },
  }
}
