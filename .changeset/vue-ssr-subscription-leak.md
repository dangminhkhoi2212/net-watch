---
'@net-watch/vue': patch
---

`useNetworkStatus` no longer subscribes on the server. Vue does not dispose component scopes during server rendering, so every render leaked one listener on the watcher.
