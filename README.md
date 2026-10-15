# net-watch

Answers two questions for any web app:

1. **Is the user really online?** Not just "Wi-Fi is on", but actually able to reach your server.
2. **How good is the connection?** Quality band, latency, throughput, and the link info the browser exposes.

Zero-dependency core, thin adapters for React, Vue and Angular. Works in Chrome/Edge 90+, Firefox 90+ and Safari/iOS 15+.

```bash
pnpm add net-watch
```

## Core

```ts
import { createBanner, createNetworkWatcher, watchFetch } from 'net-watch'

const watcher = createNetworkWatcher({
  pingUrl: '/ping', // optional, see below
  heartbeat: 60_000, // optional: also check while the app is idle
  onOffline: () => console.log('offline'),
  onOnline: () => console.log('back online'),
})

watcher.subscribe((state) => console.log(state.online, state.quality, state.rtt))
export const api = watchFetch(watcher) // use instead of fetch: real requests become free signals
await watcher.waitForOnline() // e.g. before retrying
createBanner(watcher, { offlineText: 'You are offline', onlineText: 'Back online', slowText: 'Slow connection' })
```

`quality` / `rtt` fed by `watchFetch` measure time-to-first-byte of your own requests, so a slow backend endpoint can read as `poor`.
Wrap fetch with `watchFetch`; do not assign the result to `window.fetch` (probes would be double counted).

### State

| Field | Meaning | Available in |
|---|---|---|
| `online` | really online | every browser |
| `since` | time of the last online/offline flip | every browser |
| `quality` | `excellent` < 150 ms · `good` < 400 · `fair` < 1400 · `poor` · `unknown` | every browser, once a sample exists |
| `rtt` | smoothed latency, ms (rounded to 50) | every browser, once a sample exists |
| `downlink` | smoothed throughput, Mbps | Chrome/Edge, Firefox, Safari 16.4+ |
| `effectiveType` | `slow-2g` / `2g` / `3g` / `4g` | Chrome/Edge |
| `type` | `wifi` / `cellular` / … | Chrome on Android, ChromeOS |
| `saveData` | user enabled data saver | Chrome/Edge |

A value the browser cannot provide is `undefined`, never a guess. Signal strength (Wi-Fi bars, dBm) is not exposed to web pages by any browser.

### How detection works

1. **Browser signals**: `navigator.onLine`, the `online`/`offline` events, tab visible, bfcache restore. Free and instant, but `online: true` only means a network interface is up.
2. **Real requests** through `watchFetch` (or `watcher.report(ok, rtt)`). A response proves you are online (unless the browser reports offline) and measures latency.
3. **A probe to `pingUrl`**, sent only on suspicion or while offline (backoff 2 s → 30 s), plus every `heartbeat` ms if you opt in. Without `heartbeat`, online and idle sends nothing.

Without `pingUrl` you get layers 1–2: unplugged cables and Wi-Fi off are detected, but "connected but no internet" is not.

### Choosing `pingUrl`

Use a same-origin HTTPS route that:
- answers `HEAD` with `204` and `Cache-Control: no-store`;
- needs no auth;
- is excluded from any service-worker cache.

```nginx
location = /ping { add_header Cache-Control no-store; return 204; }
```

No backend? `https://www.gstatic.com/generate_204` works, with three caveats:
- It is blocked in some regions and corporate networks, so users there would always look offline.
- It sends every user's IP to Google.
- If you use a CSP, it needs `connect-src https://www.gstatic.com`.

## React

```tsx
import { useNetworkStatus } from 'net-watch/react'
const { online, quality, rtt } = useNetworkStatus() // or useNetworkStatus(watcher)
```

## Vue

```ts
import { useNetworkStatus } from 'net-watch/vue'
const status = useNetworkStatus() // status.value.online
```

Called outside a component or effect scope, `useNetworkStatus` never unsubscribes.

## Angular

```ts
import { injectNetworkStatus } from 'net-watch/angular'
export class AppComponent {
  status = injectNetworkStatus() // status().online
}
```

Adapters default to a shared watcher without `pingUrl`; pass your own to configure it.

More docs:
- Integrations (Capacitor, service worker, TanStack Query) and writing new adapters: [docs/adapters.md](docs/adapters.md).
- How it works inside: [docs/architecture.md](docs/architecture.md).

## Development

```bash
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm test        # Vitest in Chromium, Firefox and WebKit
pnpm play        # playground
pnpm build       # tsdown → dist/
pnpm release     # bumpp version + tag
```
