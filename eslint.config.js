'use strict'

const neostandard = require('neostandard')

module.exports = [
  { ignores: ['build/**', 'public/**', 'coverage/**', 'src/js/vendor/**'] },
  ...neostandard({ env: ['node', 'browser', 'mocha'] }),
  {
    rules: {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      '@stylistic/max-len': ['warn', { code: 120, tabWidth: 2 }],
      '@stylistic/spaced-comment': 'off',
      radix: ['error', 'always'],
    },
  },
  {
    files: ['src/js/**'],
    rules: { 'no-var': 'off', 'object-shorthand': 'off', 'prefer-const': 'off' },
  },
]
