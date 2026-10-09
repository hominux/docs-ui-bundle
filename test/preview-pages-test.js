'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')
const os = require('node:os')
const { finished } = require('node:stream/promises')
const { expect } = require('./harness')
const Asciidoctor = require('@asciidoctor/core')
const buildPreviewPagesTask = require('../gulp.d/tasks/build-preview-pages')

describe('build-preview-pages', () => {
  let dest

  beforeEach(async () => {
    dest = await fsp.mkdtemp(ospath.join(os.tmpdir(), 'preview-'))
  })

  afterEach(() => fsp.rm(dest, { recursive: true, force: true }))

  it('finishes without a sink and writes the pages', async function () {
    this.timeout(15000)
    const build = buildPreviewPagesTask('src', 'preview-src', dest)
    const sink = await build((err) => {
      if (err) throw err
    })
    await finished(sink, { readable: false })
    await fsp.access(ospath.join(dest, 'index.html'))
  })

  it('reports an Asciidoctor failure to the task callback instead of hanging', async function () {
    this.timeout(15000)
    const load = Asciidoctor.load
    Asciidoctor.load = () => Promise.reject(new Error('conversion failed'))
    try {
      const build = buildPreviewPagesTask('src', 'preview-src', dest)
      const error = await new Promise((resolve) => build(resolve))
      expect(error.message).to.equal('conversion failed')
    } finally {
      Asciidoctor.load = load
    }
  })
})
