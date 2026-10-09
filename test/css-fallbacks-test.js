'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { expect } = require('./harness')

const build = fs.readFileSync(path.join(__dirname, '../gulp.d/tasks/build.js'), 'utf8')

// The default browserslist includes Opera Mini, which has no custom properties: the build has to keep
// writing a plain value before each var() declaration. importFrom is gone in postcss-custom-properties 13+.
describe('css custom property fallbacks', () => {
  it('runs postcss-custom-properties with preserve and without importFrom', () => {
    expect(build).to.include("require('postcss-custom-properties')")
    expect(build).to.include('postcssVar({ preserve: true })')
    expect(build).to.not.include('importFrom')
  })
})
