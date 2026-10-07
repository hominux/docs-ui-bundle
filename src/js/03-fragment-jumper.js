;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  var toolbar = document.querySelector('.header .navbar')

  function decodeFragment (hash) {
    return hash && (~hash.indexOf('%') ? decodeURIComponent(hash) : hash).slice(1)
  }

  function fragmentTarget (hash) {
    var fragment = decodeFragment(hash)
    return fragment ? document.getElementById(fragment) : null
  }

  function computePosition (el, sum) {
    return article.contains(el) ? computePosition(el.offsetParent, el.offsetTop + sum) : sum
  }

  function jumpToAnchor (e) {
    if (e) {
      if (e.altKey || e.ctrlKey) return
      window.location.hash = '#' + this.id
      e.preventDefault()
    }
    window.scrollTo(0, computePosition(this, 0) - toolbar.getBoundingClientRect().bottom - 80)
  }

  window.addEventListener('load', function jumpOnLoad (e) {
    var target = fragmentTarget(window.location.hash)
    if (target) {
      jumpToAnchor.bind(target)()
      setTimeout(jumpToAnchor.bind(target), 0)
    }
    window.removeEventListener('load', jumpOnLoad)
  })

  Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (el) {
    var target = fragmentTarget(el.hash)
    if (target) {
      el.addEventListener('click', jumpToAnchor.bind(target))
    }
  })
})()
