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
    expect(tree.stable).is.eql([])
    expect(tree.preview).is.eql([])
    expect(tree.snapshot).is.eql([])
  })

  it('classifies by the prerelease flag, not by the display text', () => {
    const versions = [
      { displayVersion: 'Next', prerelease: true },
      { displayVersion: '2024-LTS', prerelease: false },
      { displayVersion: '1.0.0.RC1', prerelease: 'RC1' },
      { displayVersion: '2.0.0-SNAPSHOT', prerelease: true },
    ]
    const tree = treeOf({ test: { versions } })

    expectVersions(tree.stable, ['2024-LTS'])
    expectVersions(tree.preview, ['Next', '1.0.0.RC1'])
    expectVersions(tree.snapshot, ['2.0.0-SNAPSHOT'])
  })

  it('does not mutate the components it receives', () => {
    const components = { test: { name: 'test', versions: [version('1.0.0')] } }
    const result = versionTree(components, undefined)

    expect(components.test).to.not.have.property('versionTree')
    expect(result.test.versionTree.stable).has.length(1)
  })

  it('marks the latest and current versions', () => {
    const versions = [{ displayVersion: '2.0', version: '2.0' }, { displayVersion: '1.0', version: '1.0' }]
    const tree = versionTree(
      { test: { name: 'test', versions, latest: versions[0] } },
      { component: { name: 'test' }, componentVersion: { displayVersion: '1.0' }, versions: [] }
    ).test.versionTree

    expect(tree.stable.map((v) => [v.displayVersion, v.latest, v.current])).is.eql([
      ['2.0', true, false],
      ['1.0', false, true],
    ])
  })
})
