'use strict'

const COMPONENTS_WITH_LOGO = new Set(['compress4j', 'pact-avro-plugin'])

module.exports = function componentLogo (name) {
  return COMPONENTS_WITH_LOGO.has(name) ? `${name}-logo.png` : undefined
}
