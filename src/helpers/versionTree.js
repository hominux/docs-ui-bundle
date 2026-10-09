'use strict'

module.exports = function versionTree (components, page) {
  const pageUrls = Object.fromEntries((page?.versions ?? []).map((v) => [v.displayVersion, v.url]))
  return Object.fromEntries(
    Object.entries(components).map(([key, component]) => [key, withTree(component, page, pageUrls)])
  )
}

function withTree (component, page, pageUrls) {
  const samePage = Boolean(page?.component) && component.name === page.component.name
  const current = samePage ? page.componentVersion?.displayVersion : undefined
  const tree = splitVersions(component.versions, samePage ? pageUrls : {}, current, component.latest)
  return { ...component, versionTree: tree }
}

const isSnapshot = (v) => v.displayVersion.includes('SNAPSHOT')
const isPrerelease = (v) => (v.prerelease === undefined ? v.displayVersion.includes('-') : Boolean(v.prerelease))

function splitVersions (versions, urls, current, latest) {
  const nav = (list) => list.map((v) => navVersion(v, urls, current, latest))
  return {
    snapshot: nav(versions.filter(isSnapshot)),
    stable: nav(versions.filter((v) => !isSnapshot(v) && !isPrerelease(v))),
    preview: nav(versions.filter((v) => !isSnapshot(v) && isPrerelease(v))),
  }
}

function navVersion (v, urls, current, latest) {
  return {
    url: urls[v.displayVersion] ?? v.url,
    displayVersion: v.displayVersion,
    latest: Boolean(latest) && v.version === latest.version,
    current: v.displayVersion === current,
  }
}
