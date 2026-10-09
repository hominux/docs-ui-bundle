;(function () {
  'use strict'

  var blocks = [].slice.call(document.querySelectorAll('pre code.language-mermaid'))
  if (!blocks.length) return

  // The 5 MB library is fetched only on pages that hold a diagram, from the folder this script was served from.
  var self = document.currentScript || document.querySelector('script[src*="mermaid-init"]')
  if (!self) return
  var library = document.createElement('script')
  library.src = self.src.replace(/mermaid-init\.js(?=$|[?#])/, 'mermaid.js')
  library.onload = start
  document.head.appendChild(library)

  var diagrams = []
  var renders = 0

  function start () {
    diagrams = blocks.map(function (code, idx) {
      var host = code.closest('.listingblock .content') || code.closest('pre')
      var div = document.createElement('div')
      div.className = 'mermaid'
      div.id = 'mermaid-diagram-' + idx
      host.parentNode.replaceChild(div, host)
      return { element: div, source: code.textContent }
    })
    render()
    var toggle = document.getElementById('switch-theme-checkbox')
    if (toggle) toggle.addEventListener('change', render)
  }

  // Mermaid cannot restyle a drawn SVG, so a theme change draws every diagram again from its source.
  function render () {
    var isDark = document.documentElement.classList.contains('dark-theme')
    window.mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
    })
    diagrams.forEach(function (diagram) {
      window.mermaid.render('mermaid-svg-' + renders++, diagram.source).then(function (result) {
        diagram.element.innerHTML = result.svg
      })
    })
  }
})()
