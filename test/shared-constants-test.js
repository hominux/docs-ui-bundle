'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')
const { expect } = require('./harness')

const read = (file) => fsp.readFile(ospath.join(__dirname, '..', file), 'utf8')

// The inline head script cannot import from the nav script, so these values live in two files.
describe('values shared by separate scripts', () => {
  it('uses the same nav width limits in the inline head script and the nav script', async () => {
    const limits = (text) => text.match(/Math\.min\((\d+), Math\.max\((\d+),/).slice(1)
    const inline = limits(await read('src/partials/head-styles.hbs'))
    const nav = limits(await read('src/js/01-nav.js'))
    expect(inline).is.eql(nav)
    expect(nav).is.eql(['600', '250'])
  })

  it('uses the same navbar offset for the contents highlight and the fragment jump', async () => {
    const toc = (await read('src/js/02-on-this-page.js')).match(/\* 1\.15 \+ (\d+)/)[1]
    const jump = (await read('src/js/03-fragment-jumper.js')).match(/getBoundingClientRect\(\)\.bottom - (\d+)\)/)[1]
    expect(toc).is.eql(jump)
  })
})
