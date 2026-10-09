'use strict'

const fs = require('node:fs')
const path = require('node:path')
const Handlebars = require('handlebars')
const { expect } = require('./harness')

const src = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')

const render = (partial, context) => {
  const hbs = Handlebars.create()
  hbs.registerHelper('or', require('../src/helpers/or.js'))
  hbs.registerHelper('eq', require('../src/helpers/eq.js'))
  hbs.registerHelper('relativize', (url) => url)
  hbs.registerHelper('component_logo', require('../src/helpers/component_logo.js'))
  hbs.registerHelper('detag_attr', (v) => v)
  hbs.registerHelper('and', (...a) => a.slice(0, -1).every(Boolean))
  hbs.registerHelper('versioned_url', () => '')
  hbs.registerPartial('component-logo', src('partials/component-logo.hbs'))
  return hbs.compile(src(`partials/${partial}.hbs`))(context)
}

const zirek = {
  title: 'ZirekHQ',
  keys: {
    logo: 'zirekhq-logo.png',
    githubUrl: 'https://github.com/ZirekHQ',
    communityUrl: 'https://zirekhq.github.io/#help-wanted',
    socialImage: 'social-preview.png',
    ownLinks: 'zirekhq.github.io,github.com/ZirekHQ',
    extraCss: 'css/zirek.css',
  },
  components: [{ name: 'home', title: 'Home', url: '/' }, { name: 'dengjen-tts', title: 'TTS', url: '/tts/' }],
}

describe('site.keys branding', () => {
  it('defaults to the Hominux brand without keys', () => {
    const header = render('header-content', { site: { components: [] } })
    expect(header).to.include('img/hominux-logo.png').and.to.include('>Hominux<')
    expect(header).to.include('href="https://github.com/hominux"')
    const footer = render('footer-content', { site: {} })
    expect(footer).to.include('https://github.com/hominux/.github/blob/main/SECURITY.md')
  })

  it('takes the name, logo and links from the playbook', () => {
    const header = render('header-content', { site: zirek })
    expect(header).to.include('img/zirekhq-logo.png').and.to.include('>ZirekHQ<')
    expect(header).to.include('href="https://zirekhq.github.io/#help-wanted"')
    const footer = render('footer-content', { site: zirek })
    expect(footer).to.include('https://github.com/ZirekHQ/.github/blob/main/CODE_OF_CONDUCT.md')
  })

  it('leaves the home component out of the project menu', () => {
    const header = render('header-content', { site: zirek })
    expect(header).to.not.include('>Home<')
    expect(header).to.include('TTS')
  })

  it('emits the social image, own-links meta and extra stylesheet only when set', () => {
    const page = { component: { name: 'other' } }
    const meta = render('head-meta', { site: zirek, page })
    expect(meta).to.include('/img/social-preview.png')
    expect(meta).to.include('<meta name="own-links" content="zirekhq.github.io,github.com/ZirekHQ">')
    const bare = render('head-meta', { site: {}, page })
    expect(bare).to.include('/img/hominux-logo.png')
    expect(bare).to.not.include('own-links')
    const styles = (site) => render('head-styles', { site, uiRootPath: '/_', asciidocExtensionRegistered: () => false })
    expect(styles(zirek)).to.include('href="/_/css/zirek.css"')
    expect(styles({})).to.not.include('zirek.css')
  })
})
