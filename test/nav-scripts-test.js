'use strict'

const { expect } = require('./harness')
const { runScript } = require('./harness/dom')

describe('01-nav', () => {
  const html = `
    <button id="nav-toggle-1"></button><button id="nav-toggle-2"></button>
    <div class="nav-container"><nav class="nav">
      <div class="nav-panel-menu" data-panel="menu"><ul class="nav-menu">
        <li class="nav-item" id="parent"><button class="nav-item-toggle"></button><span class="nav-text">Parent</span>
          <ul class="nav-list">
            <li class="nav-item is-current-page" id="current"><a class="nav-link" href="/current">Current</a></li>
            <li class="nav-item" id="sibling"><a class="nav-link" href="#section">Section</a></li>
          </ul>
        </li>
      </ul></div>
      <button id="nav-collapse-toggle"></button><div class="nav-resize"></div>
    </nav></div>
    <button class="version-toggle"></button>
    <article class="doc"><div class="sect1"><h2 id="section">Section</h2>
      <div class="sect2"><h3 id="deep">Deep</h3></div></div></article>`

  const load = ({ extra = '', url } = {}) => runScript('01-nav.js', html + extra, url)
  const has = (window, selector, cls) => window.document.querySelector(selector).classList.contains(cls)

  it('activates the path to the current page', () => {
    const window = load()
    expect(has(window, '#parent', 'is-active')).is.true()
    expect(has(window, '#parent', 'is-current-path')).is.true()
    expect(has(window, '#current', 'is-active')).is.true()
  })

  it('toggles a branch from its toggle and its label', () => {
    const window = load()
    const parent = window.document.querySelector('#parent')
    parent.classList.remove('is-active')
    parent.querySelector('.nav-item-toggle').click()
    expect(parent.classList.contains('is-active')).is.true()
    parent.querySelector('.nav-text').click()
    expect(parent.classList.contains('is-active')).is.false()
  })

  it('shows and hides the mobile nav', () => {
    const window = load()
    const toggle = window.document.querySelector('#nav-toggle-1')
    toggle.click()
    expect(has(window, '.nav-container', 'is-active')).is.true()
    expect(window.document.documentElement.classList.contains('is-clipped--nav')).is.true()
    toggle.click()
    expect(has(window, '.nav-container', 'is-active')).is.false()
  })

  it('stores the collapsed state of the sidebar', () => {
    const window = load()
    window.document.querySelector('#nav-collapse-toggle').click()
    expect(window.document.body.classList.contains('nav-sm')).is.true()
    expect(window.localStorage.getItem('sidebar')).is.eql('collapsed')
    window.document.querySelector('#nav-collapse-toggle').click()
    expect(window.localStorage.getItem('sidebar')).is.eql('expanded')
  })

  it('toggles the version container', () => {
    const window = load()
    const toggle = window.document.querySelector('.version-toggle')
    toggle.click()
    expect(toggle.parentElement.parentElement.classList.contains('is-active')).is.true()
  })

  it('opens the version modal', () => {
    const shown = []
    globalThis.MicroModal = { show: (id) => shown.push(id) }
    try {
      const window = load({ extra: '<button id="browse-version"></button>' })
      window.document.querySelector('#browse-version').click()
      expect(shown).is.eql(['modal-versions'])
    } finally {
      delete globalThis.MicroModal
    }
  })

  it('follows the hash to the matching nav item', () => {
    const window = load({ url: 'https://docs.example.org/page.html#section' })
    expect(has(window, '#sibling', 'is-current-page')).is.true()
    expect(has(window, '#current', 'is-current-page')).is.false()
  })

  it('follows the hash of a nested heading to its section link', () => {
    const window = load()
    window.location.hash = '#deep'
    window.dispatchEvent(new window.Event('hashchange'))
    expect(has(window, '#sibling', 'is-current-page')).is.true()
  })

  it('escapes special characters in the hash and section ids', () => {
    const window = load({ extra: '<h2 id="odd]id">Odd</h2>' })
    window.document
      .querySelector('#parent .nav-list')
      .insertAdjacentHTML('beforeend', '<li class="nav-item" id="odd"><a class="nav-link" href="#odd]id">Odd</a></li>')
    window.location.hash = '#a"b'
    expect(() => window.dispatchEvent(new window.Event('hashchange'))).to.not.throw()
    window.location.hash = '#odd]id'
    window.dispatchEvent(new window.Event('hashchange'))
    expect(has(window, '#odd', 'is-current-page')).is.true()
  })

  it('applies a stored nav width within bounds', () => {
    const window = new (require('jsdom').JSDOM)(html + '', { url: 'https://docs.example.org/' }).window
    window.localStorage.setItem('nav-width', '9000')
    globalThis.window = window
    globalThis.document = window.document
    delete require.cache[require.resolve('../src/js/01-nav.js')]
    require('../src/js/01-nav.js')
    expect(window.document.documentElement.style.getPropertyValue('--nav-width')).is.eql('600px')
  })

  it('resizes the nav while the mouse is held', () => {
    const window = load()
    window.document.querySelector('.nav-resize').dispatchEvent(new window.MouseEvent('mousedown', { cancelable: true }))
    window.document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 900 }))
    expect(window.document.documentElement.style.getPropertyValue('--nav-width')).is.eql('600px')
    window.document.dispatchEvent(new window.MouseEvent('mouseup'))
    window.document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 300 }))
    expect(window.document.documentElement.style.getPropertyValue('--nav-width')).is.eql('600px')
  })

  it('does nothing without a menu panel', () => {
    expect(() => runScript('01-nav.js', '<p></p>')).to.not.throw()
  })
})

describe('03-fragment-jumper', () => {
  const html = `
    <header class="header"><div class="navbar"></div></header>
    <article class="doc"><h2 id="target">T</h2><a href="#target">link</a><a href="#missing">no</a></article>`

  it('sets the hash and scrolls when a fragment link is clicked', () => {
    const window = runScript('03-fragment-jumper.js', html)
    const scrolls = []
    window.scrollTo = (...args) => scrolls.push(args)
    window.document.querySelector('a[href="#target"]').click()
    expect(window.location.hash).is.eql('#target')
    expect(scrolls).has.length(1)
  })

  it('ignores clicks with a modifier key', () => {
    const window = runScript('03-fragment-jumper.js', html)
    window.scrollTo = () => { throw new Error('unexpected scroll') }
    const link = window.document.querySelector('a[href="#target"]')
    expect(() => link.dispatchEvent(new window.MouseEvent('click', { ctrlKey: true, bubbles: true }))).to.not.throw()
  })

  it('does not bind links whose target is missing', () => {
    const window = runScript('03-fragment-jumper.js', html)
    window.scrollTo = () => { throw new Error('unexpected scroll') }
    expect(() => window.document.querySelector('a[href="#missing"]').click()).to.not.throw()
  })

  it('jumps to the fragment on load, decoding percent escapes', async () => {
    const window = runScript('03-fragment-jumper.js', html, 'https://docs.example.org/p.html#targ%65t')
    const scrolls = []
    window.scrollTo = (...args) => scrolls.push(args)
    window.dispatchEvent(new window.Event('load'))
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(scrolls).has.length(2)
  })

  it('tolerates malformed percent escapes', () => {
    const window = runScript('03-fragment-jumper.js', html, 'https://docs.example.org/p.html#%E0%A4%A')
    expect(() => window.dispatchEvent(new window.Event('load'))).to.not.throw()
  })
})

describe('log helper', () => {
  it('prints the value as JSON', () => {
    const lines = []
    const original = console.log
    console.log = (line) => lines.push(line)
    try {
      require('../src/helpers/log.js')({ a: 1 })
    } finally {
      console.log = original
    }
    expect(lines).is.eql(['{\n  "a": 1\n}'])
  })
})

describe('asciidocExtensionRegistered helper', () => {
  const helper = require('../src/helpers/asciidocExtensionRegistered.js')
  const ctx = (extensions) => ({ data: { root: { page: { componentVersion: { asciidoc: { extensions } } } } } })

  it('returns undefined when the component registers no extensions', () => {
    expect(helper('chai', ctx(undefined))).is.undefined()
  })

  it('returns undefined when the module is not loaded', () => {
    expect(helper('not-a-real-module-name', ctx([]))).is.undefined()
  })

  it('reports whether a loaded module is registered', () => {
    const chai = require('chai')
    expect(helper('chai', ctx([chai]))).is.true()
    expect(helper('chai', ctx([{}]))).is.false()
  })
})
