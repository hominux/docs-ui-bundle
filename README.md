# Hominux docs UI bundle

Antora UI bundle for the Hominux documentation site (Compress4J, Pact Avro Plugin).

It is a fork of [antora-ui-spring](https://github.com/spring-io/antora-ui-spring), rebranded with the Hominux
palette, header, footer, component logos, and lunr search. The fork keeps the upstream MPL-2.0 license (see `LICENSE`).

## Use it in a playbook

```yaml
ui:
  bundle:
    url: https://github.com/hominux/docs-ui-bundle/releases/download/latest/ui-bundle.zip
    snapshot: true
```

## Build

```
$ npm ci --ignore-scripts
$ npm rebuild gifsicle optipng-bin mozjpeg
$ npx gulp bundle
```

The bundle lands in `build/ui-bundle.zip`. Pushes to `main` publish it as the `latest` release asset above.

## Preview

```
$ npx gulp preview
```

Open [localhost:5252](http://localhost:5252).

## Rebrand it without forking

The bundle reads its brand from the playbook, so another site can reuse it and overlay its own files with Antora's
`ui.supplemental_files`. All keys are optional; the defaults give the Hominux brand. Antora camel-cases key names for templates (`own_links` becomes `site.keys.ownLinks`).

```yaml
site:
  title: ZirekHQ                 # nav title, footer name, og:site_name, og:description
  keys:
    logo: zirekhq-logo.png       # file in the bundle's img/ (supply it as supplemental-ui/img/zirekhq-logo.png)
    social_image: social-preview.png
    github_url: https://github.com/ZirekHQ   # header and footer links (the footer links its .github repo)
    community_url: https://zirekhq.github.io/#help-wanted
    own_links: zirekhq.github.io,github.com/ZirekHQ   # hosts or host/path prefixes that open in the same tab
    extra_css: css/zirek.css     # stylesheet loaded after site.css; overrides the tokens in vars.css
ui:
  supplemental_files: ./supplemental-ui
```

Supplemental files skip PostCSS, so `extra_css` must be plain CSS with no `var()` fallbacks. Override the colour
tokens in `vars.css` (`:root` for light, `html.dark-theme` for dark) and keep every pair in `test/contrast-test.js`
at 4.5:1. Replace `favicon*`, `*-logo.png` and `helpers/component_logo.js` by shipping a file at the same path.

## Component logos

The nav title and the version modal show a logo per component. Logos live in `src/img/<component-name>-logo.png`
(for example `compress4j-logo.png`), and `src/helpers/component_logo.js` lists the component names that have one.
Add the image, then add the component name to that list. The nav, the version modal and the `og:image` meta all read it.

## License

MPL-2.0, see `LICENSE`. The icon set in `src/img/octicons-16.svg` comes from GitHub Octicons, licensed MIT.
