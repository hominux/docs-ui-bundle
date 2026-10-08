/* eslint-disable no-undef */
;(function () {
  'use strict'

  var SECT_CLASS_RX = /^sect(\d)$/

  var navContainer = document.querySelector('.nav-container')
  var navToggle1 = document.querySelector('#nav-toggle-1')
  var navToggle2 = document.querySelector('#nav-toggle-2')
  var isNavCollapsed = readStored('sidebar') === 'collapsed'
  document.body.classList.toggle('nav-sm', isNavCollapsed)
  applyStoredNavWidth()
  if (navToggle1) {
    navToggle1.addEventListener('click', showNav)
  }
  if (navToggle2) {
    navToggle2.addEventListener('click', showNav)
  }
  var menuPanel
  if (navContainer) {
    navContainer.addEventListener('click', trapEvent)
    menuPanel = navContainer.querySelector('[data-panel=menu]')
  }
  if (!menuPanel) return
  var nav = navContainer.querySelector('.nav')

  var currentPageItem = menuPanel.querySelector('.is-current-page')
  var originalPageItem = currentPageItem
  if (currentPageItem) {
    activateCurrentPath(currentPageItem)
    scrollItemToMidpoint(menuPanel, currentPageItem.querySelector('.nav-link'))
  } else {
    menuPanel.scrollTop = 0
  }

  var currentActivePageItem = menuPanel.querySelector('.nav-item.is-current-page.is-active')
  if (currentActivePageItem?.querySelector('.nav-item-toggle')) {
    currentActivePageItem.querySelector('.nav-link').addEventListener('click', function (e) {
      currentActivePageItem.querySelector('.nav-item-toggle').click()
      e.preventDefault()
      return false
    })
  }

  find(menuPanel, '.nav-item-toggle').forEach(function (btn) {
    var li = btn.parentElement
    btn.addEventListener('click', toggleActive.bind(li))
    var navItemSpan = findNextElement(btn, '.nav-text')
    if (navItemSpan) {
      navItemSpan.style.cursor = 'pointer'
      navItemSpan.addEventListener('click', toggleActive.bind(li))
    }
  })

  var versionsToggle = document.querySelectorAll('.version-toggle')
  if (versionsToggle) {
    versionsToggle.forEach(function (el) {
      var container = el.parentElement.parentElement
      el.addEventListener('click', function () {
        container.classList.toggle('is-active')
      })
    })
  }

  listen('#browse-version', 'click', function () {
    MicroModal.show('modal-versions', {
      disableScroll: true,
    })
  })

  listen('#nav-collapse-toggle', 'click', function () {
    isNavCollapsed = !isNavCollapsed
    document.body.classList.toggle('nav-sm', isNavCollapsed)
    writeStored('sidebar', isNavCollapsed ? 'collapsed' : 'expanded')
  })

  function listen (selector, type, handler) {
    const el = document.querySelector(selector)
    if (el) el.addEventListener(type, handler)
  }

  function resolveHash () {
    var hash = window.location.hash
    if (!hash) return undefined
    if (!hash.includes('%')) return hash
    try {
      return decodeURIComponent(hash)
    } catch {
      return hash
    }
  }

  function navLinkForSection (node) {
    var id = node.id
    // NOTE: look for section heading
    if (!id && SECT_CLASS_RX.test(node.className)) id = node.firstElementChild?.id
    return id ? menuPanel.querySelector('.nav-link[href="#' + CSS.escape(id) + '"]') : null
  }

  function findAncestorNavLink (targetNode) {
    var ceiling = document.querySelector('article.doc')
    var current = targetNode.parentNode
    while (current && current !== ceiling) {
      var navLink = navLinkForSection(current)
      if (navLink) return navLink
      current = current.parentNode
    }
    return undefined
  }

  function findHashNavLink (hash) {
    var navLink = menuPanel.querySelector('.nav-link[href="#' + CSS.escape(hash.slice(1)) + '"]')
    if (navLink) return navLink
    var targetNode = document.getElementById(hash.slice(1))
    return targetNode ? findAncestorNavLink(targetNode) : undefined
  }

  function onHashChange () {
    var hash = resolveHash()
    var navLink = hash ? findHashNavLink(hash) : undefined
    var navItem = navLink ? navLink.parentNode : originalPageItem
    if (!navItem) return
    if (!navLink) navLink = navItem.querySelector('.nav-link')
    if (navItem === currentPageItem) return
    find(menuPanel, '.nav-item.is-active').forEach(function (el) {
      el.classList.remove('is-active', 'is-current-path', 'is-current-page')
    })
    navItem.classList.add('is-current-page')
    currentPageItem = navItem
    activateCurrentPath(navItem)
    scrollItemToMidpoint(menuPanel, navLink)
  }

  if (menuPanel.querySelector('.nav-link[href^="#"]')) {
    if (window.location.hash) onHashChange()
    window.addEventListener('hashchange', onHashChange)
  }

  function activateCurrentPath (navItem) {
    var ancestor = navItem.parentNode
    while (!ancestor.classList.contains('nav-menu')) {
      if (ancestor.tagName === 'LI' && ancestor.classList.contains('nav-item')) {
        ancestor.classList.add('is-active', 'is-current-path')
      }
      ancestor = ancestor.parentNode
    }
    navItem.classList.add('is-active')
  }

  function toggleActive () {
    if (this.classList.toggle('is-active')) {
      var padding = Number.parseFloat(window.getComputedStyle(this).marginTop)
      var rect = this.getBoundingClientRect()
      var menuPanelRect = menuPanel.getBoundingClientRect()
      var overflowY = (rect.bottom - menuPanelRect.top - menuPanelRect.height + padding).toFixed()
      if (overflowY > 0) menuPanel.scrollTop += Math.min((rect.top - menuPanelRect.top - padding).toFixed(), overflowY)
    }
  }

  function navToggles () {
    return [navToggle1, navToggle2].filter(Boolean)
  }

  function showNav (e) {
    if (navToggles().some((toggle) => toggle.classList.contains('is-active'))) return hideNav(e)
    trapEvent(e)
    var html = document.documentElement
    html.classList.add('is-clipped--nav')
    navToggles().forEach((toggle) => toggle.classList.add('is-active'))
    navContainer.classList.add('is-active')
    var bounds = nav.getBoundingClientRect()
    var expectedHeight = window.innerHeight - Math.round(bounds.top)
    if (Math.round(bounds.height) !== expectedHeight) nav.style.height = expectedHeight + 'px'
    html.addEventListener('click', hideNav)
  }

  function hideNav (e) {
    trapEvent(e)
    var html = document.documentElement
    html.classList.remove('is-clipped--nav')
    navToggles().forEach((toggle) => toggle.classList.remove('is-active'))
    navContainer.classList.remove('is-active')
    html.removeEventListener('click', hideNav)
  }

  function trapEvent (e) {
    e.stopPropagation()
  }

  function scrollItemToMidpoint (panel, el) {
    var rect = panel.getBoundingClientRect()
    var effectiveHeight = rect.height
    var navStyle = window.getComputedStyle(nav)
    if (navStyle.position === 'sticky') effectiveHeight -= rect.top - Number.parseFloat(navStyle.top)
    panel.scrollTop = Math.max(0, (el.getBoundingClientRect().height - effectiveHeight) * 0.5 + el.offsetTop)
  }

  function find (from, selector) {
    return Array.from(from.querySelectorAll(selector))
  }

  function findNextElement (from, selector) {
    var el = from.nextElementSibling
    if (!el || !selector) return el
    return el[el.matches ? 'matches' : 'msMatchesSelector'](selector) && el
  }

  // Navbar width
  function clampNavWidth (width) {
    return Math.min(600, Math.max(250, width))
  }

  function setNavbarWidth (width) {
    document.documentElement.style.setProperty('--nav-width', `${width}px`)
    writeStored('nav-width', `${width}`)
  }

  function applyStoredNavWidth () {
    const width = Number.parseInt(readStored('nav-width'), 10)
    if (Number.isFinite(width)) {
      document.documentElement.style.setProperty('--nav-width', `${clampNavWidth(width)}px`)
    }
  }

  function readStored (key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }

  function writeStored (key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // storage blocked: the preference applies for this page view only
    }
  }

  listen('.nav-resize', 'mousedown', (event) => {
    event.preventDefault()
    document.addEventListener('mousemove', resize, false)
    document.addEventListener(
      'mouseup',
      () => {
        document.removeEventListener('mousemove', resize, false)
      },
      { once: true }
    )
  })
  function resize (e) {
    setNavbarWidth(clampNavWidth(e.x))
  }
})()
