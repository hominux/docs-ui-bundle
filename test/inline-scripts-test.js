'use strict'

const fs = require('node:fs')
const { JSDOM } = require('jsdom')
const path = require('node:path')
const { expect } = require('./harness')

const inlineScript = (partial) => {
  const source = fs.readFileSync(path.join(__dirname, '../src/partials', partial), 'utf8')
  return source.slice(source.lastIndexOf('<script>') + '<script>'.length, source.lastIndexOf('</script>'))
}

const run = (partial, { html = '<body></body>', stored = {}, blocked = false, dark = false } = {}) => {
  const dom = new JSDOM(html, { url: 'https://docs.example.org/', runScripts: 'outside-only' })
  const { window } = dom
  Object.entries(stored).forEach(([key, value]) => window.localStorage.setItem(key, value))
  if (blocked) Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('SecurityError') } })
  window.matchMedia = () => ({ matches: dark })
  window.eval(inlineScript(partial))
  return window
}

describe('nav.hbs inline script', () => {
  it('restores the collapsed sidebar stored by 01-nav.js', () => {
    expect(run('nav.hbs', { stored: { sidebar: 'collapsed' } }).document.body.classList.contains('nav-sm')).is.true()
  })

  it('leaves an expanded sidebar alone', () => {
    expect(run('nav.hbs', { stored: { sidebar: 'expanded' } }).document.body.classList.contains('nav-sm')).is.false()
  })

  it('survives blocked storage', () => {
    expect(() => run('nav.hbs', { blocked: true })).to.not.throw()
  })
})

describe('head-styles.hbs inline script', () => {
  const root = (window) => window.document.documentElement
  const width = (window) => root(window).style.getPropertyValue('--nav-width')

  it('applies the stored dark theme', () => {
    expect(root(run('head-styles.hbs', { stored: { theme: 'dark' } })).classList.contains('dark-theme')).is.true()
  })

  it('falls back to the system theme', () => {
    expect(root(run('head-styles.hbs', { dark: true })).classList.contains('dark-theme')).is.true()
  })

  it('clamps the stored nav width', () => {
    expect(width(run('head-styles.hbs', { stored: { 'nav-width': '9000' } }))).is.eql('600px')
    expect(width(run('head-styles.hbs', { stored: { 'nav-width': '10' } }))).is.eql('250px')
    expect(width(run('head-styles.hbs', { stored: { 'nav-width': '320' } }))).is.eql('320px')
  })

  it('ignores a malformed nav width', () => {
    expect(width(run('head-styles.hbs', { stored: { 'nav-width': 'wide' } }))).is.eql('')
  })

  it('still applies the system theme when storage is blocked', () => {
    const window = run('head-styles.hbs', { blocked: true, dark: true })
    expect(root(window).classList.contains('dark-theme')).is.true()
    expect(width(window)).is.eql('')
  })
})

describe('header-content.hbs inline script', () => {
  const html = '<body><span><input id="switch-theme-checkbox"></span></body>'
  const active = (window) => window.document.querySelector('span').classList.contains('active')

  it('marks the theme switch active for the stored dark theme', () => {
    expect(active(run('header-content.hbs', { html, stored: { theme: 'dark' } }))).is.true()
  })

  it('survives blocked storage and falls back to the system theme', () => {
    expect(active(run('header-content.hbs', { html, blocked: true, dark: true }))).is.true()
    expect(active(run('header-content.hbs', { html, blocked: true }))).is.false()
  })
})
