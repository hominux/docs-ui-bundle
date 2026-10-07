/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const versionTree = require('../src/helpers/versionTree.js')

const version = (displayVersion, url) => (url ? { displayVersion, url } : { displayVersion })
const component = (name, versions) => ({ test: { name, versions } })
const page = (name, versions) => ({ component: { name }, versions })
const treeOf = (...args) => versionTree(...args).test.versionTree

function expectStableUrl (tree, displayVersion, url) {
  expect(tree.stable.length).is.eql(1)
  expect(tree.stable[0].displayVersion).is.eql(displayVersion)
  expect(tree.stable[0].url).is.eql(url)
}

function expectVersions (list, expected) {
  expect(list.length).is.eql(expected.length)
  expected.forEach((displayVersion, i) => expect(list[i].displayVersion).is.eql(displayVersion))
}

describe('versionTree', () => {
  it('should return stable, preview and snapshot versions', () => {
    const versions = ['3.0.1-SNAPSHOT', '3.0.0-SNAPSHOT', '2.0.0', '1.0.0', '1.0.0-RC1', '1.0.0-RC2']
    const tree = treeOf({ test: { versions: versions.map((it) => version(it)) } })

    expectVersions(tree.stable, ['2.0.0', '1.0.0'])
    expectVersions(tree.preview, ['1.0.0-RC1', '1.0.0-RC2'])
    expectVersions(tree.snapshot, ['3.0.1-SNAPSHOT', '3.0.0-SNAPSHOT'])
  })

  const overrideCases = [
    ['page version overrides urls when component names are the same', 'test', '2.0.0', './page.html'],
    ['does not override if page does not define same version', 'test', '1.0.0', './version.html'],
    ['page versions do not override if different component name', 'baz', '2.0.0', './version.html'],
  ]

  overrideCases.forEach(([title, pageComponent, pageVersion, expectedUrl]) => {
    it(title, () => {
      const tree = treeOf(
        component('test', [version('2.0.0', './version.html')]),
        page(pageComponent, [version(pageVersion, './page.html')])
      )

      expectStableUrl(tree, '2.0.0', expectedUrl)
    })
  })

  it('should return an empty structure', () => {
    const tree = treeOf({ test: { versions: [] } })
    expect(tree.stable).is.eql(null)
    expect(tree.preview).is.eql(null)
    expect(tree.snapshot).is.eql(null)
  })
})
