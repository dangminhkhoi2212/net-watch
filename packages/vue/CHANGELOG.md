# @net-watch/vue

## 0.1.1

### Patch Changes

- 1019cd6: Better npm discoverability: keywords, clearer descriptions, README rewrites and `homepage` pointing at the documentation site.
- 1d033ef: `useNetworkStatus` no longer subscribes on the server. Vue does not dispose component scopes during server rendering, so every render leaked one listener on the watcher.
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
