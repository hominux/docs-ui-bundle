'use strict'

const { expect } = require('./harness')
const { runScript } = require('./harness/dom')

describe('04-page-versions', () => {
  const html = '<div class="page-versions"><button class="version-menu-toggle"></button></div>'

  it('toggles the menu and closes it on outside click', () => {
    const window = runScript('04-page-versions.js', html)
    const menu = window.document.querySelector('.page-versions')
    window.document.querySelector('.version-menu-toggle').click()
    expect(menu.classList.contains('is-active')).is.true()
    window.document.documentElement.click()
    expect(menu.classList.contains('is-active')).is.false()
  })

  it('does nothing without a toggle', () => {
    expect(() => runScript('04-page-versions.js', '<p></p>')).to.not.throw()
  })
})

describe('05-mobile-navbar', () => {
  const html = '<div class="navbar-burger" data-target="menu"></div><div id="menu"></div>'

  it('opens and closes the navbar menu', () => {
    const window = runScript('05-mobile-navbar.js', html)
    const burger = window.document.querySelector('.navbar-burger')
    burger.click()
    expect(window.document.getElementById('menu').classList.contains('is-active')).is.true()
    expect(burger.getAttribute('aria-expanded')).is.eql('true')
    expect(window.document.documentElement.classList.contains('is-clipped--navbar')).is.true()
    burger.click()
    expect(burger.getAttribute('aria-expanded')).is.eql('false')
    expect(window.document.documentElement.classList.contains('is-clipped--navbar')).is.false()
  })

  it('does nothing without a burger', () => {
    expect(() => runScript('05-mobile-navbar.js', '<p></p>')).to.not.throw()
  })
})

function toggle (window) {
  const checkbox = window.document.getElementById('switch-theme-checkbox')
  checkbox.checked = !checkbox.checked
  checkbox.dispatchEvent(new window.Event('change'))
  return checkbox
}

describe('07-switch-theme', () => {
  const html = '<span><input type="checkbox" id="switch-theme-checkbox"></span>'

  it('applies and stores the dark theme', () => {
    const window = runScript('07-switch-theme.js', html)
    const checkbox = toggle(window)
    expect(window.document.documentElement.classList.contains('dark-theme')).is.true()
    expect(window.document.documentElement.dataset.theme).is.eql('dark')
    expect(window.localStorage.getItem('theme')).is.eql('dark')
    expect(checkbox.parentElement.classList.contains('active')).is.true()
  })

  it('reverts to the light theme', () => {
    const window = runScript('07-switch-theme.js', html)
    toggle(window)
    const checkbox = toggle(window)
    expect(window.document.documentElement.dataset.theme).is.eql('light')
    expect(checkbox.parentElement.classList.contains('active')).is.false()
  })

  it('starts checked when the page is already dark', () => {
    const window = runScript('07-switch-theme.js', `<html class="dark-theme"><body>${html}</body></html>`)
    expect(window.document.getElementById('switch-theme-checkbox').checked).is.true()
  })

  it('survives blocked storage', () => {
    const window = runScript('07-switch-theme.js', html)
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('blocked') } })
    expect(() => toggle(window)).to.not.throw()
  })
})

describe('02-on-this-page', () => {
  const html = `
    <div class="content"><article class="doc">
      <h1 class="page">Title</h1><p>intro</p>
      <div class="sect1"><h2 id="one">One</h2>
        <div class="sectionbody"><div class="sect2"><h3 id="one-a">One A</h3></div></div></div>
      <div class="sect1"><h2 id="two">Two</h2></div>
      <a href="https://other.example.com/x">out</a><a href="/local">in</a>
    </article></div>
    <div class="toc" data-levels="2"></div>`

  it('builds a table of contents from the headings', () => {
    const window = runScript('02-on-this-page.js', html)
    const links = [...window.document.querySelectorAll('.toc-menu li a')].map((a) => a.getAttribute('href'))
    expect(links).is.eql(['#one', '#one-a', '#two'])
    expect(window.document.querySelector('aside.toc.embedded')).is.not.null()
  })

  it('marks only external links', () => {
    const window = runScript('02-on-this-page.js', html)
    const [out, local] = window.document.querySelectorAll('.content article a:not([href^="#"])')
    expect(out.classList.contains('external')).is.true()
    expect(out.getAttribute('rel')).is.eql('noopener noreferrer')
    expect(local.classList.contains('external')).is.false()
  })

  it('removes the sidebar when the page has no headings', () => {
    const page = '<div class="content"><article class="doc"><p>x</p></article></div><div class="toc"></div>'
    const window = runScript('02-on-this-page.js', page)
    expect(window.document.querySelector('.toc')).is.null()
  })

  it('removes the sidebar when the body opts out', () => {
    const window = runScript('02-on-this-page.js', `<body class="-toc">${html}</body>`)
    expect(window.document.querySelector('div.toc')).is.null()
  })
})
