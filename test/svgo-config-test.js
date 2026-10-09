'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')
const { expect } = require('./harness')
const svgoConfig = require('../gulp.d/lib/svgo-config')

// load the svgo that imagemin-svgo (and so gulp-imagemin) actually runs
const { optimize } = require(require.resolve('svgo', { paths: [require.resolve('imagemin-svgo')] }))

describe('svgo config', () => {
  it('keeps the icon and view ids the stylesheets link to', async () => {
    const sprite = await fsp.readFile(ospath.join(__dirname, '../src/img/octicons-16.svg'), 'utf8')
    const { data } = optimize(sprite, svgoConfig)
    for (const id of ['icon-copy', 'view-copy', 'view-unfold', 'view-fold']) {
      expect(data, `${id} must survive optimisation`).to.include(`id="${id}"`)
    }
  })
})
