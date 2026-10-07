# Compress4J docs UI bundle

Antora UI for the Compress4J documentation site.

This is a fork of [fedora/docs/docs-website/ui-bundle](https://gitlab.com/fedora/docs/docs-website/ui-bundle)
(itself derived from [`@antora/ui-default`](https://gitlab.com/antora/antora-ui-default)),
rebranded for Compress4J (logo, footer, contributing link; the color palette is inherited from the ZirekHQ fork).

## How to use it with Antora

Add the following configuration in your Antora playbook:

```yaml
ui:
  bundle:
    url: https://github.com/compress4j/docs-ui-bundle/releases/download/latest/ui-bundle.zip
    snapshot: true
```

## Build and preview the UI

### Local development with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

```
$ git clone https://github.com/compress4j/docs-ui-bundle.git
$ cd docs-ui-bundle
$ npm install
```

Build the UI bundle:

```
$ npx gulp
```

Or build and preview with live reload:

```
$ npx gulp preview
```

Preview it on [localhost:5252](http://localhost:5252).

The generated bundle can be found in `build/ui-bundle.zip`. On push to `main`, CI
publishes this as the `latest` GitHub Release asset at the URL above.

### License

Most source code for the project is licensed under the
Mozilla License 2.0 (MPL-2.0).
A copy can be found in the `./LICENSE` file.

The clipboard icon comes from the Adwaita icon theme,
courtesy of the GNOME Project https://gnome.org/.
License: Creative Commons Attribution Share-Alike 3.0 (CC-BY-SA-3.0).
A copy can be found in `./LICENSES/CC-BY-SA-3.0.txt`.
