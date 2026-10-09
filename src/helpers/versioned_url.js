'use strict'

module.exports = function versionedUrl (site, versionSegment, url) {
  const siteUrl = site ?? ''
  if (!url) {
    // occurs with stock pages like 404.html
    return url
  } else if (!versionSegment || url.includes(`/${versionSegment}/`)) {
    return `${siteUrl}${url}`
  } else {
    return `${siteUrl}/${versionSegment}${url}`
  }
}
