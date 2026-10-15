# Building adapters and integrations

An adapter turns the core watcher into a framework's native reactive value. The core contract (`NetworkState`, `NetworkWatcher`) is defined once, in [architecture.md](architecture.md#public-contract).

## Adapter contract

Every adapter, current or future (React, Vue, Angular, Svelte, Solid, Lit, …):

1. Lives in `src/<framework>.ts` and is exported as `net-watch/<framework>`.
2. Imports from `./index` only, and uses only `getState()`, `subscribe()` and `sharedWatcher()`.
3. Takes an optional `watcher` argument that defaults to `sharedWatcher()`, so users can pass a configured watcher.
4. Returns the framework's read-only reactive value of the full `NetworkState`.
5. Unsubscribes when the framework's owner is destroyed (component, scope, injector).
6. Is SSR-safe: React passes a server snapshot; other frameworks read `getState()`, which is SSR-safe in core.
7. Holds no detection logic. If an adapter needs a new behaviour, add it to core first, then use it.

Vue and Angular read `getState()` on first render, so on Chromium (where the browser exposes connection metrics at creation) the first client render can differ from the server render. Use the same watcher state on both sides, or render quality-dependent UI after mount.

Size target: about 10 lines. A longer adapter is a signal that logic belongs in core.

## Reference implementations

### React: `src/react.ts`

```ts
import { useSyncExternalStore } from 'react'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from './index'

const SERVER_STATE: NetworkState = {
  online: true,
  since: 0,
  quality: 'unknown',
  rtt: undefined,
  downlink: undefined,
  effectiveType: undefined,
  type: undefined,
  saveData: false,
}

export function useNetworkStatus(watcher: NetworkWatcher = sharedWatcher()): NetworkState {
  return useSyncExternalStore(watcher.subscribe, watcher.getState, () => SERVER_STATE)
}
```

`getState` and `subscribe` are plain closures in core, so they are passed unbound. The stable state reference is what keeps `useSyncExternalStore` from looping.

### Vue: `src/vue.ts`

```ts
import { computed, getCurrentScope, onScopeDispose, shallowRef, type ComputedRef } from 'vue'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from './index'

export function useNetworkStatus(watcher: NetworkWatcher = sharedWatcher()): ComputedRef<NetworkState> {
  const state = shallowRef(watcher.getState())
  const off = watcher.subscribe((s) => {
    state.value = s
  })
  if (getCurrentScope()) onScopeDispose(off)
  return computed(() => state.value)
}
```

### Angular: `src/angular.ts`

```ts
import { DestroyRef, inject, signal, type Signal } from '@angular/core'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from './index'

/** Call in an injection context (constructor or field initializer). */
export function injectNetworkStatus(watcher: NetworkWatcher = sharedWatcher()): Signal<NetworkState> {
  const state = signal(watcher.getState())
  const off = watcher.subscribe((s) => state.set(s))
  inject(DestroyRef).onDestroy(off)
  return state.asReadonly()
}
```

The Angular adapter is a plain function using `signal` and `DestroyRef`. It has no decorators, so tsdown builds it without ng-packagr.

## Adding a new adapter: checklist

- [ ] Failing test first in `tests/<framework>.test.ts(x)`. It covers: the initial value, an update after `setNetwork(false)`, and no further updates after the owner is destroyed.
- [ ] `src/<framework>.ts` following the contract above.
- [ ] Entry added to `tsdown.config.ts` `entry`. Run `pnpm build`; tsdown regenerates `exports` in package.json.
- [ ] Framework added to `peerDependencies` **and** `peerDependenciesMeta.<name>.optional = true`, plus `devDependencies` for tests.
- [ ] `pnpm vitest run` green on chromium, firefox and webkit; `pnpm typecheck` clean.
- [ ] Usage section in README.

Test helpers live in `tests/helpers.ts`: `mockOnLine(online)` fakes `navigator.onLine`; `setNetwork(online)` also fires the matching window event.

## Integrations via `report()`

Sources outside the browser's own signals feed the watcher through `report(ok, rtt?)`. These are recipes for users, not shipped modules.

**Capacitor / Ionic** (native OS connectivity):

```ts
import { Network } from '@capacitor/network'
Network.addListener('networkStatusChange', (s) => watcher.report(s.connected))
```

**Service worker** (sees every request, including axios and images). Add this to the app's existing SW; do not ship a second one:

```js
// sw.js: inside the app's existing fetch handling
async function notify(online) {
  for (const client of await self.clients.matchAll()) client.postMessage({ type: 'net-watch', online })
}
// page:
navigator.serviceWorker.addEventListener('message', (e) => {
  if (e.data?.type === 'net-watch') watcher.report(e.data.online)
})
```

**TanStack Query** (the other direction: net-watch drives Query's online manager):

```ts
import { onlineManager } from '@tanstack/query-core'
watcher.subscribe((s) => onlineManager.setOnline(s.online))
```

**Electron and Tauri**: the renderer or webview is a browser, so core works unchanged.

Promote a recipe to a shipped adapter (e.g. `net-watch/capacitor`) only when users ask for it, following the adapter contract above.
