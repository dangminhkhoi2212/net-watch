---
'@net-watch/core': minor
'@net-watch/react': minor
'@net-watch/vue': minor
'@net-watch/angular': patch
---

Ship CommonJS next to ES modules, so `require('@net-watch/core')` (and react, vue) works in Jest's CommonJS mode and on Node versions that cannot `require()` ES modules. `exports` now has `import` and `require` conditions, with matching `.d.cts` types.

TypeScript projects on `moduleResolution: node10` (TypeScript 5 and below, the default with `module: commonjs`) can now resolve `@net-watch/core/fetch`, `@net-watch/core/banner` and `@net-watch/angular` (`typesVersions` for core, `main`/`module`/`types` for angular).
