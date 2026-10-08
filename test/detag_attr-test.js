/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const detagAttr = require('../src/helpers/detag_attr.js')

describe('detag_attr', () => {
  const cases = [
    ['strips tags', 'The <code>foo</code> API', 'The foo API'],
    ['encodes double quotes', 'Say "hi"', 'Say &quot;hi&quot;'],
    ['encodes a bare ampersand', 'Fish & chips', 'Fish &amp; chips'],
    ['keeps named entities', 'Fish &amp; chips &lt;3', 'Fish &amp; chips &lt;3'],
    ['keeps numeric entities', 'It&#8217;s &#x27;ok&#x27;', 'It&#8217;s &#x27;ok&#x27;'],
    ['passes undefined through', undefined, undefined],
  ]
  cases.forEach(([title, input, expected]) => {
    it(title, () => expect(detagAttr(input)).is.eql(expected))
  })
})
