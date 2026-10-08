'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')
const os = require('node:os')
const { finished } = require('node:stream/promises')
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
})
