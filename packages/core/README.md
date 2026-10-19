<div align="center">

# @net-watch/core

**Is the user really online, and how good is the connection?**

[![npm](https://img.shields.io/npm/v/@net-watch/core?color=0e9f6e&label=npm)](https://www.npmjs.com/package/@net-watch/core)
[![license](https://img.shields.io/npm/l/@net-watch/core?color=blue)](https://github.com/dangminhkhoi2212/net-watch/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/@net-watch/core)](https://www.npmjs.com/package/@net-watch/core)

[Documentation](https://net-watch-docs.vercel.app) · [Live demo](https://net-watch-docs.vercel.app) · [Source](https://github.com/dangminhkhoi2212/net-watch)

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/demo.gif" alt="net-watch live demo: latency and quality update, then the connection goes offline and recovers" width="640" />

</div>

Zero-dependency network status for the web: online/offline detection that goes beyond `navigator.onLine`, connection quality (latency, throughput, quality bands), `watchFetch`, and an offline banner.

## Why

`navigator.onLine` only says a network interface is up. It stays `true` behind a captive portal, a dead router or a blocked server. net-watch combines browser signals, your real requests and an optional probe to report whether your server is reachable, and how fast the connection is.

- Detects offline, including "connected but no internet", with no polling while online and idle.
- Reports `rtt`, `quality` (`excellent`, `good`, `fair`, `poor`) and `downlink`. A value the browser cannot provide stays `undefined`.
- Under 3 kB gzipped, no dependencies, SSR-safe, typed.
- Works in Chrome/Edge 90+, Firefox 90+ and Safari/iOS 15+.

## Install

```bash
pnpm add @net-watch/core   # or npm i / yarn add
```

## Usage

```ts
import { createNetworkWatcher } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

const watcher = createNetworkWatcher({ pingUrl: '/ping' })
const api = watchFetch(watcher)                    // use instead of fetch
createBanner(watcher, { slowText: 'Slow connection' })
watcher.subscribe((state) => console.log(state.online, state.quality, state.rtt))
```

## State

| Field | Meaning |
|---|---|
| `online` | really online |
| `quality` | `excellent` < 150 ms, `good` < 400, `fair` < 1400, `poor`, or `unknown` |
| `rtt` | smoothed latency in ms |
| `downlink` | smoothed throughput in Mbps |
| `effectiveType`, `type`, `saveData` | link info, where the browser exposes it |

## Adapters

[`@net-watch/react`](https://www.npmjs.com/package/@net-watch/react) · [`@net-watch/vue`](https://www.npmjs.com/package/@net-watch/vue) · [`@net-watch/angular`](https://www.npmjs.com/package/@net-watch/angular)

## Learn more

[How detection works](https://net-watch-docs.vercel.app/docs/concepts/how-it-works) · [Choosing a ping endpoint](https://net-watch-docs.vercel.app/docs/guides/ping-endpoint) · [API reference](https://net-watch-docs.vercel.app/docs/reference/api) · [Use with AI assistants](https://net-watch-docs.vercel.app/docs/ai/use-with-ai)

## License

MIT
