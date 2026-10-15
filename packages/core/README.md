# @net-watch/core

Is the user really online, and how good is the connection? Zero-dependency network status for the web: layered online/offline detection, latency / throughput / quality, `watchFetch`, and an offline banner.

```bash
pnpm add @net-watch/core
```

```ts
import { createNetworkWatcher } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

const watcher = createNetworkWatcher({ pingUrl: '/ping' })
const api = watchFetch(watcher)
createBanner(watcher, { slowText: 'Slow connection' })
watcher.subscribe((state) => console.log(state.online, state.quality, state.rtt))
```

Framework adapters: `@net-watch/react`, `@net-watch/vue`, `@net-watch/angular`. Full documentation: https://github.com/dangminhkhoi2212/net-watch
