'use strict'

module.exports = function versionedUrl (siteUrl = '', versionSegment, url) {
  if (!url) {
    // occurs with stock pages like 404.html
    return url
  } else if (!versionSegment || url.includes(`/${versionSegment}/`)) {
    return `${siteUrl}${url}`
  } else {
    return `${siteUrl}/${versionSegment}${url}`
  }
}
