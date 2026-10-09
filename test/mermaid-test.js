'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { expect } = require('./harness')
const { runScript } = require('./harness/dom')

const root = path.join(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('mermaid', () => {
  it('pins mermaid to an exact version', () => {
    expect(JSON.parse(read('package.json')).devDependencies.mermaid).to.match(/^\d+\.\d+\.\d+$/)
  })

  it('loads only the deferred initialiser; the library is fetched on demand', () => {
    const footer = read('src/partials/footer-scripts.hbs')
    expect(footer).to.not.include('js/vendor/mermaid.js')
    const init = footer.indexOf('js/vendor/mermaid-init.js')
    expect(init, 'mermaid-init.js tag').to.be.above(-1)
    expect(footer.slice(footer.lastIndexOf('<script', init), init)).to.include('defer')
  })

  describe('initialiser', () => {
    const script = '<script src="https://docs.example.org/_/js/vendor/mermaid-init.js"></script>'
    const diagram = '<div class="listingblock"><div class="title">Flow</div><div class="content"><pre>' +
      '<code class="language-mermaid">graph TD; A-->B</code></pre></div></div>'
    const toggle = '<input type="checkbox" id="switch-theme-checkbox">'

    const load = (window) => {
      const calls = []
      window.mermaid = {
        initialize: (o) => calls.push(['initialize', o.theme]),
        render: (id, source) => {
          calls.push(['render', id, source])
          return Promise.resolve({ svg: `<svg data-n="${calls.length}"></svg>` })
        },
      }
      window.document.head.querySelector('script').onload()
      return calls
    }
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

    it('does not fetch the library on pages without a diagram', () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}<p>none</p></body>`)
      expect(window.document.head.querySelector('script')).to.be.null()
    })

    it('fetches mermaid.js next to itself, then draws the diagram once it loads', async () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}${diagram}</body>`)
      const library = window.document.head.querySelector('script')
      expect(library.src).to.equal('https://docs.example.org/_/js/vendor/mermaid.js')
      expect(window.document.querySelector('.mermaid')).to.be.null()
      const calls = load(window)
      await settle()
      expect(calls).to.eql([['initialize', 'default'], ['render', 'mermaid-svg-0', 'graph TD; A-->B']])
      expect(window.document.querySelector('.mermaid svg')).to.not.be.null()
    })

    it('keeps the listing title and replaces only the code', async () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}${diagram}</body>`)
      load(window)
      await settle()
      const block = window.document.querySelector('.listingblock')
      expect(block.querySelector('.title').textContent).to.equal('Flow')
      expect(block.querySelector('pre')).to.be.null()
      expect(block.querySelector('.mermaid')).to.not.be.null()
    })

    it('draws the diagram again in the new theme when the theme switch changes', async () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}${toggle}${diagram}</body>`)
      const calls = load(window)
      await settle()
      window.document.documentElement.classList.add('dark-theme')
      window.document.getElementById('switch-theme-checkbox').dispatchEvent(new window.Event('change'))
      await settle()
      expect(calls.filter((c) => c[0] === 'initialize')).to.eql([['initialize', 'default'], ['initialize', 'dark']])
      expect(calls.filter((c) => c[0] === 'render').map((c) => c[1])).to.eql(['mermaid-svg-0', 'mermaid-svg-1'])
      expect(window.document.querySelectorAll('.mermaid svg')).to.have.lengthOf(1)
    })
  })

  it('picks the dark mermaid theme from the dark-theme class and keeps strict security', () => {
    const init = read('src/js/vendor/mermaid-init.bundle.js')
    expect(init).to.include("classList.contains('dark-theme')")
    expect(init).to.include("securityLevel: 'strict'")
    expect(init).to.include('pre code.language-mermaid')
  })

  it('styles the rendered diagram container', () => {
    expect(read('src/css/site.css')).to.include('@import "diagrams.css";')
    expect(read('src/css/diagrams.css')).to.include('.mermaid svg')
  })

  it('falls back to the enclosing pre, never to the grandparent', () => {
    const init = read('src/js/vendor/mermaid-init.bundle.js')
    expect(init).to.include("code.closest('pre')")
    expect(init).to.not.include('parentNode.parentNode')
  })
})
