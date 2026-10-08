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
    expect(src('css/doc.css')).to.match(/\.doc p a \{\s*text-decoration: underline;/)
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
