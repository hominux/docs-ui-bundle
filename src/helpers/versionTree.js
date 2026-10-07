'use strict'

module.exports = function versionTreeHelper (components, page) {
  return versionTree(components, page)
}

function versionTree (components, page) {
  const versionToUrl = {}
  if (page?.versions) {
    page.versions.forEach((v) => {
      versionToUrl[v.displayVersion] = v.url
    })
  }
  for (const [, component] of Object.entries(components)) {
    const samePageComponent = Boolean(component && page?.component) && component.name === page.component.name
    const componentVersionToUrl = samePageComponent ? versionToUrl : {}
    component.versionTree = splitVersions(
      component.versions,
      componentVersionToUrl,
      currentVersion(component, page),
      component.latest
    )
  }
  return components
}

function currentVersion (component, page) {
  return page?.component && page.componentVersion && component.name === page.component.name
    ? page.componentVersion.displayVersion
    : undefined
}

function splitVersions (versions, versionToUrl, current, latest) {
  const toNav = (v) => navVersion(v, versionToUrl, current, latest)
  const snapshot = versions.filter((v) => v.displayVersion.includes('SNAPSHOT')).map(toNav)
  const stable = versions.filter((v) => !v.displayVersion.includes('-')).map(toNav)
  const preview = versions
    .filter((v) => !v.displayVersion.includes('SNAPSHOT') && v.displayVersion.includes('-'))
    .map(toNav)
  return {
    snapshot: snapshot.length > 0 ? snapshot : null,
    stable: stable.length > 0 ? stable : null,
    preview: preview.length > 0 ? preview : null,
  }
}

function navVersion (v, versionToUrl, current, latest) {
  const navVersion = {
    url: v.url,
    displayVersion: v.displayVersion,
    latest: Boolean(latest) && v.version === latest.version,
    current: v.displayVersion === current,
  }
  if (versionToUrl[v.displayVersion]) {
    navVersion.url = versionToUrl[v.displayVersion]
  }
  return navVersion
}
