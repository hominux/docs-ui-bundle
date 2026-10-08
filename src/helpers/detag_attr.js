'use strict'

const TAG_ALL_RX = /<[^<>]+>/g
const BARE_AMP_RX = /&(?!(?:[A-Za-z][A-Za-z0-9]*|#\d+|#[xX][0-9A-Fa-f]+);)/g

module.exports = function detagAttr (html) {
  return html?.replaceAll(TAG_ALL_RX, '').replaceAll(BARE_AMP_RX, '&amp;').replaceAll('"', '&quot;')
}
