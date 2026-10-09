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

## Component logos

The nav title and the version modal show a logo per component. Logos live in `src/img/<component-name>-logo.png`
(for example `compress4j-logo.png`), and `src/helpers/component_logo.js` lists the component names that have one.
Add the image, then add the component name to that list. The nav, the version modal and the `og:image` meta all read it.

## License

MPL-2.0, see `LICENSE`. The icon set in `src/img/octicons-16.svg` comes from GitHub Octicons, licensed MIT.
