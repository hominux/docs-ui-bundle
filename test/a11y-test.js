'use strict'

const fs = require('node:fs')
const Handlebars = require('handlebars')
const path = require('node:path')
const { expect } = require('./harness')

const src = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')

describe('accessibility', () => {
  it('labels each nav landmark so landmarks are unique', () => {
    expect(src('partials/header-content.hbs')).to.include('<nav class="navbar" aria-label="Main">')
    expect(src('partials/nav.hbs')).to.include('<nav class="nav-menu" aria-label="Documentation">')
    expect(src('partials/pagination.hbs')).to.include('<nav class="pagination" aria-label="Pagination">')
  })

  it('titles the on-this-page menu with an h2 so the heading order does not skip a level', () => {
    expect(src('js/02-on-this-page.js')).to.include("createElement('h2')")
    expect(src('css/toc.css')).to.include('.toc .toc-menu h2')
  })

  it('underlines inline links in running text', () => {
    const rule = /\.doc p a,\s*\.doc td a,\s*\.doc li a,\s*\.doc dd a \{\s*text-decoration: underline;/
    expect(src('css/doc.css')).to.match(rule)
  })
})

describe('nav-explore version badge', () => {
  const render = (page) => {
    const hbs = Handlebars.create()
    hbs.registerHelper('relativize', (url) => url)
    hbs.registerPartial('component-logo', '')
    return hbs.compile(src('partials/nav-explore.hbs'))({ page })
  }
  const page = {
    component: { name: 'docs', title: 'Docs' },
    componentVersion: { url: '/docs/', displayVersion: 'default' },
  }

  it('shows the version for a component that has versions', () => {
    expect(render({ ...page, versions: [{}, {}] })).to.include('<span class="version">default</span>')
  })

  it('omits the badge for an unversioned component', () => {
    expect(render(page)).to.not.include('class="version"')
  })
})

describe('collapsed sidebar', () => {
  it('only lets the menu panel overflow at desktop widths so the mobile drawer keeps scrolling', () => {
    const css = src('css/nav.css')
    expect(css).to.not.match(/^body\.nav-sm \.nav-panel-menu \{/m)
    const scoped = /@media screen and \(min-width: 1024px\) \{\s*body\.nav-sm \.nav-panel-menu \{\s*overflow: visible;/
    expect(css).to.match(scoped)
  })
})

describe('partial includes', () => {
  it('leaves no partial references that the bundle does not ship', () => {
    const partials = fs.readdirSync(path.join(__dirname, '../src/partials'))
    const shipped = new Set(partials.map((file) => file.replace(/\.hbs$/, '')))
    partials.forEach((file) => {
      const used = [...src(`partials/${file}`).matchAll(/\{\{>\s*([\w-]+)/g)].map((match) => match[1])
      used.forEach((name) => expect(shipped.has(name), `${file} includes missing partial ${name}`).is.true())
    })
  })
})

describe('focus indicators', () => {
  it('forces a visible outline on keyboard focus even where components remove it', () => {
    const css = src('css/base.css')
    const ring = /:is\(a, button, input, summary, \[tabindex\]\):focus-visible \{\s*outline: 2px solid [^;]*!important;/
    expect(css).to.match(ring)
    expect(css).to.match(/\.header :is\([^)]*\):focus-visible \{\s*outline-color: #fff !important;/)
  })
})
