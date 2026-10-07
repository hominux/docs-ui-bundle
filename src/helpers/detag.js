'use strict'

const TAG_ALL_RX = /<[^<>]+>/g

module.exports = function detag (html) {
  return html?.replace(TAG_ALL_RX, '')
}
