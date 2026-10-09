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
    const diagram = '<div class="listingblock"><pre><code class="language-mermaid">graph TD; A-->B</code></pre></div>'

    it('does not fetch the library on pages without a diagram', () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}<p>none</p></body>`)
      expect(window.document.head.querySelector('script')).to.be.null()
    })

    it('fetches mermaid.js next to itself, then renders the diagram once it loads', () => {
      const window = runScript('vendor/mermaid-init.bundle.js', `<body>${script}${diagram}</body>`)
      const library = window.document.head.querySelector('script')
      expect(library.src).to.equal('https://docs.example.org/_/js/vendor/mermaid.js')
      expect(window.document.querySelector('.mermaid')).to.be.null()
      const calls = []
      window.mermaid = {
        initialize: (o) => calls.push(['initialize', o.theme]),
        run: (o) => calls.push(['run', o.querySelector]),
      }
      library.onload()
      expect(window.document.querySelector('.mermaid').textContent).to.equal('graph TD; A-->B')
      expect(calls).to.eql([['initialize', 'default'], ['run', '.mermaid']])
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
