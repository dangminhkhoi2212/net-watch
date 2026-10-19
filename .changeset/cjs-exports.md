---
'@net-watch/core': minor
'@net-watch/react': minor
'@net-watch/vue': minor
---

Ship CommonJS next to ES modules, so `require('@net-watch/core')` (and react, vue) works in Jest's CommonJS mode and on Node versions that cannot `require()` ES modules. `exports` now has `import` and `require` conditions, with matching `.d.cts` types.
