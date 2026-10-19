# @net-watch/react

## 0.2.0

### Minor Changes

- 424abce: Ship CommonJS next to ES modules, so `require('@net-watch/core')` (and react, vue) works in Jest's CommonJS mode and on Node versions that cannot `require()` ES modules. `exports` now has `import` and `require` conditions, with matching `.d.cts` types.
  
  TypeScript projects on `moduleResolution: node10` (TypeScript 5 and below, the default with `module: commonjs`) can now resolve `@net-watch/core/fetch`, `@net-watch/core/banner` and `@net-watch/angular` (`typesVersions` for core, `main`/`module`/`types` for angular).

### Patch Changes

- Updated dependencies [424abce]
  - @net-watch/core@0.2.0

## 0.1.1

### Patch Changes

- 1019cd6: Better npm discoverability: keywords, clearer descriptions, README rewrites and `homepage` pointing at the documentation site.
- Updated dependencies [1019cd6]
  - @net-watch/core@0.1.1

## 0.1.0

### Minor Changes

- 273e84a: Initial release: layered online/offline detection, connection quality (rtt, downlink, quality bands), `watchFetch`, an offline banner, and React, Vue and Angular adapters.

### Patch Changes

- Updated dependencies [273e84a]
  - @net-watch/core@0.1.0

## 0.1.0-beta.0

### Minor Changes

- 273e84a: Initial release: layered online/offline detection, connection quality (rtt, downlink, quality bands), `watchFetch`, an offline banner, and React, Vue and Angular adapters.

### Patch Changes

- Updated dependencies [273e84a]
  - @net-watch/core@0.1.0-beta.0
