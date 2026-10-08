/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')

function run () {
  const module = '../src/js/08-copy-versioned-url.js'
  delete require.cache[require.resolve(module)]
  require(module)
}

describe('08-copy-versioned-url', () => {
  let versionedUrl
  let button
  let timeout
  let clipboard
  let meta
  let document
  let window

  beforeEach(async () => {
    versionedUrl = 'https://docs.spring.io/spring-security/reference/index.html'
    button = {
      classes: [],
      click: function () {
        console.log('hi')
      },
      addEventListener: function (event, callback) {
        button.click = function () {
          callback.call(this)
        }
      },
      classList: {
        add: function (cls) {
          button.classes.push(cls)
        },
        remove: function (cls) {
          const index = button.classes.indexOf(cls)
          if (index > -1) {
            button.classes.splice(index, 1)
          }
        },
      },
    }
    timeout = {
      invocations: [],
      setTimeout: function (callback, time) {
        timeout.invocations.push({ callback: callback, time: time })
      },
      run: function () {
        timeout.invocations.forEach((i) => {
          i.callback()
        })
        timeout.invocations = []
      },
    }
    clipboard = {
      content: '',
      writeText: function (text) {
        clipboard.content = text
      },
    }
    meta = {
      content: versionedUrl,
    }
    document = {
      getElementById: function (id) {
        button.id = id
        return button
      },
      querySelector: function (expression) {
        meta.expression = expression
        return meta
      },
    }
    window = {
      location: {
        hash: undefined,
      },
      navigator: {
        clipboard: clipboard,
      },
    }
    global.setTimeout = timeout.setTimeout
    global.document = document
    global.window = window
  })

  afterEach(async () => {
    delete global.setTimeout
    delete global.document
    delete global.window
  })

  it('button undefined', async () => {
    document.getElementById = function (id) {}
    run()
    // no errors (skips setup)
  })

  it('button id is copy-url', async () => {
    run()
    expect(button.id).eqls('copy-url')
  })

  it('meta expression is meta[name="versioned-url"]', async () => {
    run()
    button.click()
    expect(meta.expression).eqls('meta[name="versioned-url"]')
  })

  it('versioned-url expression undefined]', async () => {
    run()
    document.querySelector = function (q) {}
    button.click()
  })

  it('click button adds copied class & timeout clears it', async () => {
    run()
    expect(button.classes).eqls([])
    button.click()
    expect(button.classes).eqls(['copied'])
    expect(timeout.invocations[0].time).eqls(1500)
    timeout.run()
    expect(button.classes).eqls([])
  })

  it('hash is undefined', async () => {
    run()
    button.click()
    expect(clipboard.content).eqls(versionedUrl)
  })

  const hashCases = [
    ['is simple', '#welcome', true],
    // spring boot does this
    ['contains .', '#topic.subtopic', true],
    ['contains -', '#topic-subtopic', true],
    ['contains _', '#topic_subtopic', true],
    ['contains number', '#topic1_subtopic2', true],
    ['contains invalid', '#topic<script', false],
  ]

  hashCases.forEach(([title, hash, accepted]) => {
    it(`hash ${title}`, async () => {
      window.location.hash = hash
      run()
      button.click()
      expect(clipboard.content).eqls(accepted ? versionedUrl + hash : versionedUrl)
    })
  })
})
