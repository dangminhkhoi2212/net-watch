<div align="center">

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/logo.svg" alt="net-watch logo" width="56" height="56" />

# net-watch

**Know when your users are really offline, and how good their connection is.**

Zero-dependency network status for the web, with adapters for React, Vue and Angular.

[![npm](https://img.shields.io/npm/v/@net-watch/core?color=0e9f6e&label=npm)](https://www.npmjs.com/package/@net-watch/core)
[![CI](https://github.com/dangminhkhoi2212/net-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/dangminhkhoi2212/net-watch/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@net-watch/core?color=blue)](LICENSE)
[![types](https://img.shields.io/npm/types/@net-watch/core)](https://www.npmjs.com/package/@net-watch/core)

[Documentation](https://net-watch-docs.vercel.app) · [Live demo](https://net-watch-docs.vercel.app) · [Quick start](https://net-watch-docs.vercel.app/docs/quick-start) · [API reference](https://net-watch-docs.vercel.app/docs/reference/api)

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/demo.gif" alt="net-watch live demo: latency and quality update as requests slow down, the banner warns about a slow connection, then reports offline and back online" width="720" />

</div>

## Why net-watch

`navigator.onLine` only says a network interface is up. It stays `true` behind a captive portal, a router with no internet, or a blocked server. net-watch answers two questions instead:

1. **Is the user really online?** Not just "Wi-Fi is on", but able to reach your server.
2. **How good is the connection?** Quality band, latency, throughput and the link info the browser exposes.

| Situation | `navigator.onLine` | net-watch |
|---|---|---|
| Wi-Fi connected, router has no internet | online | **offline** |
| Hotel Wi-Fi waiting for a sign-in page | online | **offline** |
| Your server is down or blocked | online | **offline** |
| In a tunnel: connected, every request takes seconds | online | online, quality **poor** |
| Airplane mode | offline | offline |

## Features

- **Real offline detection** from three layers: browser signals, your own requests, and an optional probe. An online, idle app sends no requests unless you opt into `heartbeat`.
- **Connection quality**: smoothed `rtt`, `quality` (`excellent`, `good`, `fair`, `poor`) and `downlink`. A metric the browser does not expose stays `undefined`, never a guess.
- **`watchFetch`**: your real requests become free measurements.
- **Offline banner** with a light and a dark look, recoloured with CSS variables.
- **Framework adapters** for React, Vue and Angular. Each is about ten lines over the core.
- **Small and safe**: core is under 3 kB gzipped, has no dependencies, is SSR-safe and ships its own types.
- **Cross-browser**: Chrome/Edge 90+, Firefox 90+, Safari/iOS 15+.

```bash
pnpm add @net-watch/core                    # core (or npm i / yarn add)
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

## Documentation

The documentation site (landing page with a live demo, guides, API reference and prompts for AI assistants) is live at https://net-watch-docs.vercel.app. Its source lives in [apps/docs](apps/docs):

```bash
pnpm docs   # builds the packages, then starts the site on http://localhost:3000
```

Its pages are MDX files in `apps/docs/content/docs`. `/llms.txt` and `/llms-full.txt` give AI assistants the whole documentation, and any docs URL ending in `.md` returns that page as Markdown.

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

Releases run in CI (trunk-based: PRs into `main`, a Version Packages PR ships stable releases, every merge with pending changesets ships a `beta` snapshot): see [docs/releasing.md](docs/releasing.md).

Layout and conventions: [docs/architecture.md](docs/architecture.md#repository-layout).
