'use strict'

const { expect } = require('./harness')
const helper = (name) => require(`../src/helpers/${name}.js`)

describe('logic helpers', () => {
  const and = helper('and')
  const or = helper('or')

  it('and returns the conjunction of two arguments', () => {
    expect(and(true, false, {})).is.false()
    expect(and(true, true, {})).is.true()
  })

  it('and returns true only when every argument is truthy', () => {
    expect(and(1, 'a', true, {})).is.true()
    expect(and(1, '', true, {})).is.false()
  })

  it('and rejects fewer than two arguments', () => {
    expect(() => and(true, {})).to.throw('at least 2 arguments')
  })

  it('or returns the disjunction of two arguments', () => {
    expect(or(false, true, {})).is.true()
    expect(or(false, 0, {})).is.eql(0)
  })

  it('or returns true when any argument is truthy', () => {
    expect(or(0, '', 'x', {})).is.true()
    expect(or(0, '', null, {})).is.false()
  })

  it('or rejects fewer than two arguments', () => {
    expect(() => or(true, {})).to.throw('at least 2 arguments')
  })

  it('eq, ne and not compare strictly', () => {
    expect(helper('eq')(1, 1)).is.true()
    expect(helper('eq')(1, '1')).is.false()
    expect(helper('ne')(1, '1')).is.true()
    expect(helper('not')('')).is.true()
  })

  it('notEmpty only rejects null', () => {
    expect(helper('notEmpty')(null)).is.false()
    expect(helper('notEmpty')('')).is.true()
  })
})

describe('data helpers', () => {
  it('split returns an empty list for empty input', () => {
    expect(helper('split')('a,b')).is.eql(['a', 'b'])
    expect(helper('split')('')).is.eql([])
    expect(helper('split')(undefined)).is.eql([])
  })

  it('increment treats a missing value as zero', () => {
    expect(helper('increment')(2)).is.eql(3)
    expect(helper('increment')(undefined)).is.eql(1)
  })

  it('json pretty-prints with two spaces', () => {
    expect(helper('json')({ a: 1 })).is.eql('{\n  "a": 1\n}')
  })

  it('year returns the current year as a string', () => {
    expect(helper('year')()).is.eql(String(new Date().getFullYear()))
  })

  it('detag strips tags and passes undefined through', () => {
    expect(helper('detag')('a <b>c</b>')).is.eql('a c')
    expect(helper('detag')(undefined)).is.undefined()
  })
})
