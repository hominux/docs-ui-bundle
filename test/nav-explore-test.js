'use strict'

const fs = require('node:fs')
const path = require('node:path')
const Handlebars = require('handlebars')
const { expect } = require('./harness')

const src = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')

const render = (page) => {
  const hbs = Handlebars.create()
  hbs.registerHelper('component_logo', require('../src/helpers/component_logo.js'))
  hbs.registerHelper('relativize', (url) => url)
  hbs.registerPartial('component-logo', src('partials/component-logo.hbs'))
  return hbs.compile(src('partials/nav-explore.hbs'))({ page })
}

const page = (extra) => ({
  component: { name: 'dengjen-nvda', title: 'dengjen-nvda' },
  componentVersion: { url: '/x/', displayVersion: 'next' },
  ...extra,
})

describe('nav-explore version badge', () => {
  it('shows the version for a component that has versions', () => {
    expect(render(page({ versions: [{}, {}] }))).to.include('<span class="version">next</span>')
  })

  it('omits the badge for an unversioned component', () => {
    const out = render({ ...page({}), componentVersion: { url: '/home/', displayVersion: 'default' } })
    expect(out).to.not.include('class="version"')
  })
})
