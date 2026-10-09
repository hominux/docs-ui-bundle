'use strict'

// svgo 2 (used by imagemin-svgo 10) names this plugin cleanupIDs; svgo 3 renamed it cleanupIds.
// An unknown override name is ignored silently and svgo then minifies every id, which breaks
// the url(octicons-16.svg#view-*) fragments the stylesheets use.
module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIDs: { preservePrefixes: ['icon-', 'view-'] },
          removeViewBox: false,
          removeDesc: false,
        },
      },
    },
  ],
}
