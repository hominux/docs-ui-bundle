'use strict'

module.exports = function json (data) {
  return JSON.stringify(data, null, 2)
}
