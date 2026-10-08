'use strict'

const TAG_ALL_RX = /<[^<>]+>/g
const BARE_AMP_RX = /&(?!(?:[A-Za-z][A-Za-z0-9]*|#\d+|#[xX][0-9A-Fa-f]+);)/g

module.exports = function detagAttr (html) {
  return html?.replace(TAG_ALL_RX, '').replace(BARE_AMP_RX, '&amp;').replace(/"/g, '&quot;')
}
