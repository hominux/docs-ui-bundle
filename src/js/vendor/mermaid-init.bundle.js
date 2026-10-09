;(function () {
  'use strict'

  var blocks = [].slice.call(document.querySelectorAll('pre code.language-mermaid'))
  if (!blocks.length) return

  // The 5 MB library is fetched only on pages that hold a diagram, from the folder this script was served from.
  var self = document.currentScript || document.querySelector('script[src*="mermaid-init"]')
  if (!self) return
  var library = document.createElement('script')
  library.src = self.src.replace(/mermaid-init\.js(?=$|[?#])/, 'mermaid.js')
  library.onload = render
  document.head.appendChild(library)

  function render () {
    var isDark = document.documentElement.classList.contains('dark-theme')
    window.mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
    })

    blocks.forEach(function (code, idx) {
      var wrapper = code.closest('.listingblock') || code.closest('pre')
      var div = document.createElement('div')
      div.className = 'mermaid'
      div.id = 'mermaid-diagram-' + idx
      div.textContent = code.textContent
      wrapper.parentNode.replaceChild(div, wrapper)
    })

    window.mermaid.run({ querySelector: '.mermaid' })
  }
})()
