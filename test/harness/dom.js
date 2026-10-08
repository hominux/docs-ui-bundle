'use strict'

const { JSDOM } = require('jsdom')

// jsdom does not implement CSS.escape; browsers do.
function cssEscape (value) {
  return [...String(value)]
    .map((ch, i) => {
      const code = ch.codePointAt(0)
      if (code === 0) return '\uFFFD'
      if (code < 0x20 || code === 0x7f || (i === 0 && ch >= '0' && ch <= '9')) return `\\${code.toString(16)} `
      if (/[\w-]/.test(ch) || code >= 0x80) return ch
      return `\\${ch}`
    })
    .join('')
}

function runScript (file, html, url = 'https://docs.example.org/page.html') {
  const dom = new JSDOM(html, { url })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.CSS = { escape: cssEscape }
  const path = require.resolve(`../../src/js/${file}`)
  delete require.cache[path]
  require(path)
  return dom.window
}

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5))
  delete globalThis.window
  delete globalThis.document
  delete globalThis.CSS
})

module.exports = { runScript }
