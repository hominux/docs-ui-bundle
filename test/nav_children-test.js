/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const navChildren = require('../src/helpers/nav_children.js')

const leaf = (url) => ({ content: url, url })
const kids = [leaf('/a/one.html'), leaf('/a/two.html')]
const otherKids = [leaf('/b/one.html')]
const navigation = [
  { root: true, items: [{ content: 'A', url: '/a/index.html', items: kids }] },
  { root: true, items: [{ content: 'B', url: '/b/index.html', items: otherKids }] },
]

describe('nav_children', () => {
  it('finds children of a match in the first entry', () => {
    expect(navChildren(navigation, '/a/index.html')).is.equal(kids)
  })

  it('finds children of a match in the second top-level entry', () => {
    expect(navChildren(navigation, '/b/index.html')).is.equal(otherKids)
  })

  it('finds children of a top-level entry itself', () => {
    const top = [{ content: 'Top', url: '/top.html', items: kids }]
    expect(navChildren(top, '/top.html')).is.equal(kids)
  })

  it('returns undefined when nothing matches', () => {
    expect(navChildren(navigation, '/missing.html')).is.undefined()
  })
})
