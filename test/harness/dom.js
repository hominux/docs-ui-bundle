'use strict'

const { JSDOM } = require('jsdom')

function runScript (file, html, url = 'https://docs.example.org/page.html') {
  const dom = new JSDOM(html, { url })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  const path = require.resolve(`../../src/js/${file}`)
  delete require.cache[path]
  require(path)
  return dom.window
}

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5))
  delete globalThis.window
  delete globalThis.document
})

module.exports = { runScript }
