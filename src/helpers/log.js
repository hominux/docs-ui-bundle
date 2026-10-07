'use strict'

module.exports = function log (a) {
  return console.log(JSON.stringify(a, null, 2))
}
