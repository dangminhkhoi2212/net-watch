# net-watch

Answers two questions for any web app:

1. **Is the user really online?** Not just "Wi-Fi is on", but actually able to reach your server.
2. **How good is the connection?** Quality band, latency, throughput, and the link info the browser exposes.

Zero-dependency core, thin adapters for React, Vue and Angular. Works in Chrome/Edge 90+, Firefox 90+ and Safari/iOS 15+.

```bash
pnpm add @net-watch/core                    # core
pnpm add @net-watch/core @net-watch/react   # React (same for vue / angular)
```

## Packages

| Package | Purpose |
|---|---|
| [`@net-watch/core`](packages/core) | Watcher, `watchFetch` (`/fetch`) and offline banner (`/banner`). Zero dependencies. |
| [`@net-watch/react`](packages/react) | `useNetworkStatus()` hook |
| [`@net-watch/vue`](packages/vue) | `useNetworkStatus()` composable |
| [`@net-watch/angular`](packages/angular) | `injectNetworkStatus()` signal |

All four share one version. Each adapter depends on `@net-watch/core` and has its framework as a peer dependency.

## Core

```ts
import { createNetworkWatcher } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

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

The banner is a floating card with a light and a dark look. `theme` is `'auto'` (default, follows the system), `'light'` or `'dark'`, and `setTheme()` switches it later, for example from your own dark-mode toggle:

```ts
const banner = createBanner(watcher, { theme: 'auto' })
banner.setTheme('dark') // 'auto' | 'light' | 'dark'
```

Recolour it with CSS variables:

```css
.netwatch-banner[data-state='offline'] {
  --netwatch-bg: #fff0f0; /* also --netwatch-fg, --netwatch-accent */
}
```

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
import { useNetworkStatus } from '@net-watch/react'
const { online, quality, rtt } = useNetworkStatus() // or useNetworkStatus(watcher)
```

## Vue

```ts
import { useNetworkStatus } from '@net-watch/vue'
const status = useNetworkStatus() // status.value.online
```

Called outside a component or effect scope, `useNetworkStatus` never unsubscribes.

## Angular

```ts
import { injectNetworkStatus } from '@net-watch/angular'
export class AppComponent {
  status = injectNetworkStatus() // status().online
}
```

Adapters default to a shared watcher without `pingUrl`; pass your own to configure it.

More docs:
- Integrations (Capacitor, service worker, TanStack Query) and writing new adapters: [docs/adapters.md](docs/adapters.md).
- How it works inside: [docs/architecture.md](docs/architecture.md).

## Examples

Runnable apps in [apps/](apps/), each with a live state table, a request button and a slow-request button (it makes `quality` drop so you can see the banner):

```bash
pnpm install
pnpm example:vanilla   # core only: watcher, watchFetch, banner
pnpm example:react     # useNetworkStatus + banner
```

For a custom port: `pnpm --filter @net-watch/example-vanilla dev --port 5601`.

To go offline, use DevTools → Network → Offline. The dev server provides the `/ping` endpoint the examples use as `pingUrl`. The apps import `@net-watch/*` as a real app would; Vite resolves them to the repo source, so no build is needed. Vue and Angular follow the same pattern: see [Vue](#vue) and [Angular](#angular) above.

## Development

```bash
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm test        # Vitest in Chromium, Firefox and WebKit
pnpm build       # tsdown → each package's dist/
pnpm typecheck   # packages and apps
pnpm changeset         # describe a change to a published package
pnpm version-packages  # apply the version bumps and changelogs
pnpm release           # build + publish the versioned packages
```

Releases run in CI (gitflow: `develop` ships betas, `main` ships stable releases): see [docs/releasing.md](docs/releasing.md).

Layout and conventions: [docs/architecture.md](docs/architecture.md#repository-layout).
