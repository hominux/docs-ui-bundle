;(function () {
  'use strict'

  var articleSelector = 'article.doc'

  markExternalLinks()

  var sidebar = document.querySelector('div.toc')
  if (!sidebar) return
  if (document.querySelector('body.-toc')) return sidebar.remove()
  var levels = Number.parseInt(sidebar.dataset.levels || 2, 10)
  if (levels < 0) return

  var article = document.querySelector(articleSelector)
  var headings = find(headingsSelector(levels), article.parentNode)
  if (!headings.length) return sidebar.remove()

  var lastActiveFragment
  var links = {}
  var list = buildList(headings)
  var menu = buildMenu(list)
  embedToc(menu)

  window.addEventListener('load', function () {
    onScroll()
    window.addEventListener('scroll', onScroll)
  })

  function markExternalLinks () {
    document.querySelectorAll('.content article a').forEach(function (item) {
      const location = window.location
      if (location && item.hostname && item.hostname !== location.hostname) {
        item.classList.add('external')
        item.setAttribute('target', '_blank')
      }
    })
  }

  function levelSelector (level) {
    var selector = [articleSelector]
    if (!level) return selector.concat('h1[id].sect0')
    for (var l = 1; l <= level; l++) selector.push((l === 2 ? '.sectionbody>' : '') + '.sect' + l)
    return selector.concat('h' + (level + 1) + '[id]')
  }

  function headingsSelector (maxLevel) {
    var selectors = []
    for (var level = 0; level <= maxLevel; level++) selectors.push(levelSelector(level).join('>'))
    return selectors.join(',')
  }

  function buildList (items) {
    return items.reduce(function (accum, heading) {
      var fragment = '#' + heading.id
      var link = document.createElement('a')
      link.textContent = heading.textContent
      link.href = fragment
      links[fragment] = link
      var listItem = document.createElement('li')
      listItem.dataset.level = Number.parseInt(heading.nodeName.slice(1), 10) - 1
      listItem.appendChild(link)
      accum.appendChild(listItem)
      return accum
    }, document.createElement('ul'))
  }

  function buildMenu (tocList) {
    var tocMenu = sidebar.querySelector('.toc-menu')
    if (!tocMenu) {
      tocMenu = document.createElement('div')
      tocMenu.className = 'toc-menu'
    }
    var title = document.createElement('h3')
    title.textContent = sidebar.dataset.title || 'Contents'
    tocMenu.appendChild(title)
    tocMenu.appendChild(tocList)
    return tocMenu
  }

  function embedToc (tocMenu) {
    var startOfContent = !document.getElementById('toc') && article.querySelector('h1.page ~ :not(.is-before-toc)')
    if (!startOfContent) return
    var embeddedToc = document.createElement('aside')
    embeddedToc.className = 'toc embedded'
    embeddedToc.appendChild(tocMenu.cloneNode(true))
    startOfContent.parentNode.insertBefore(embeddedToc, startOfContent)
  }

  function onScroll () {
    var scrolledBy = window.pageYOffset
    var buffer = getNumericStyleVal(document.documentElement, 'fontSize') * 1.15 + 80
    var ceil = article.offsetTop
    if (scrolledBy && window.innerHeight + scrolledBy + 2 >= document.documentElement.scrollHeight) {
      activateTrailingFragments(ceil)
      return
    }
    clearFragmentRange()
    updateActiveFragment(findActiveFragment(buffer, ceil))
  }

  function isBelowCeiling (heading, isLast, ceil) {
    return isLast || heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') > ceil
  }

  function activateTrailingFragments (ceil) {
    if (!Array.isArray(lastActiveFragment)) lastActiveFragment = lastActiveFragment ? [lastActiveFragment] : []
    var activeFragments = []
    var lastIdx = headings.length - 1
    headings.forEach(function (heading, idx) {
      var fragment = '#' + heading.id
      if (isBelowCeiling(heading, idx === lastIdx, ceil)) {
        activeFragments.push(fragment)
        if (!lastActiveFragment.includes(fragment)) links[fragment].classList.add('is-active')
      } else if (lastActiveFragment.includes(fragment)) {
        links[lastActiveFragment.shift()].classList.remove('is-active')
      }
    })
    list.scrollTop = list.scrollHeight - list.offsetHeight
    lastActiveFragment = activeFragments.length > 1 ? activeFragments : activeFragments[0]
  }

  function clearFragmentRange () {
    if (!Array.isArray(lastActiveFragment)) return
    lastActiveFragment.forEach(function (fragment) {
      links[fragment].classList.remove('is-active')
    })
    lastActiveFragment = undefined
  }

  function findActiveFragment (buffer, ceil) {
    var activeFragment
    headings.some(function (heading) {
      if (heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') - buffer > ceil) return true
      activeFragment = '#' + heading.id
      return false
    })
    return activeFragment
  }

  function updateActiveFragment (activeFragment) {
    if (!activeFragment) {
      if (lastActiveFragment) links[lastActiveFragment].classList.remove('is-active')
      lastActiveFragment = undefined
      return
    }
    if (activeFragment === lastActiveFragment) return
    if (lastActiveFragment) links[lastActiveFragment].classList.remove('is-active')
    var activeLink = links[activeFragment]
    activeLink.classList.add('is-active')
    if (list.scrollHeight > list.offsetHeight) {
      list.scrollTop = Math.max(0, activeLink.offsetTop + activeLink.offsetHeight - list.offsetHeight)
    }
    lastActiveFragment = activeFragment
  }

  function find (selector, from) {
    return Array.from((from || document).querySelectorAll(selector))
  }

  function getNumericStyleVal (el, prop) {
    return Number.parseFloat(window.getComputedStyle(el)[prop])
  }
})()
