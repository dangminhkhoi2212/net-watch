# Building adapters and integrations

An adapter turns the core watcher into a framework's native reactive value. The core contract (`NetworkState`, `NetworkWatcher`) is defined once, in [architecture.md](architecture.md#public-contract).

## Adapter contract

Every adapter, current or future (React, Vue, Angular, Svelte, Solid, Lit, …):

1. Lives in a package of its own: `packages/<framework>`, name `@net-watch/<framework>`, source in `src/index.ts`.
2. Imports only from `@net-watch/core` and its own framework, and uses only `getState()`, `subscribe()` and `sharedWatcher()`.
3. Takes an optional `watcher` argument that defaults to `sharedWatcher()`, so users can pass a configured watcher.
4. Returns the framework's read-only reactive value of the full `NetworkState`.
5. Unsubscribes when the framework's owner is destroyed (component, scope, injector).
6. Is SSR-safe and leaves nothing behind on the server: React passes a server snapshot (and `useSyncExternalStore` never subscribes there); Vue subscribes only once the component is mounted; Angular unsubscribes through `DestroyRef` when the owner is destroyed. Other frameworks read `getState()`, which is SSR-safe in core.
7. Holds no detection logic. If an adapter needs a new behaviour, add it to core first, then use it.

Vue and Angular read `getState()` on first render, so on Chromium (where the browser exposes connection metrics at creation) the first client render can differ from the server render. Use the same watcher state on both sides, or render quality-dependent UI after mount.

Size target: about 10 lines. A longer adapter is a signal that logic belongs in core.

## Reference implementations

### React: `packages/react/src/index.ts`

```ts
import { useSyncExternalStore } from 'react'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from '@net-watch/core'

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

### Vue: `packages/vue/src/index.ts`

Inside a component the composable subscribes in `onMounted`, which never runs while rendering on the server (Vue does not dispose component scopes there, so a subscription made in `setup` would leak one listener per render). Outside a component it subscribes immediately.

```ts
import { computed, getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, shallowRef, type ComputedRef } from 'vue'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from '@net-watch/core'

export function useNetworkStatus(watcher: NetworkWatcher = sharedWatcher()): ComputedRef<NetworkState> {
  const state = shallowRef(watcher.getState())
  const subscribe = () => {
    state.value = watcher.getState() // catch up with anything that changed since setup
    return watcher.subscribe((s) => {
      state.value = s
    })
  }

  if (getCurrentInstance()) {
    // Inside a component, subscribe once it is mounted. onMounted never runs while rendering on the server, where Vue
    // does not dispose component scopes: a subscription made in setup would leak one listener per render.
    let off: (() => void) | undefined
    onMounted(() => {
      off = subscribe()
    })
    onScopeDispose(() => off?.())
  } else {
    const off = subscribe()
    if (getCurrentScope()) onScopeDispose(off)
  }
  return computed(() => state.value)
}
```

### Angular: `packages/angular/src/index.ts`

```ts
import { DestroyRef, inject, signal, type Signal } from '@angular/core'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from '@net-watch/core'

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

- [ ] Create `packages/<framework>` by copying `packages/react` as the template: `package.json`, `tsdown.config.ts`, `vitest.config.ts`, `tsconfig.json` (and `tsconfig.build.json`), README, LICENSE, `tests/helpers.ts`.
- [ ] Failing test first in `packages/<framework>/tests/<framework>.test.ts(x)`. It covers: the initial value, an update after `setNetwork(false)`, and no further updates after the owner is destroyed.
- [ ] `src/index.ts` following the contract above, importing from `@net-watch/core`.
- [ ] `package.json`: name `@net-watch/<framework>`, `@net-watch/core` as `workspace:^` dependency, the framework as a **required** peer in `peerDependencies`, and as a `catalog:` devDependency for tests. Run `pnpm build`; tsdown regenerates `exports`.
- [ ] Add a `catalog:` entry for the framework in `pnpm-workspace.yaml`.
- [ ] Add the package name to the `fixed` group in `.changeset/config.json`.
- [ ] Add its alias to `workspaceAlias` in `config/vite.ts` (add the framework to the `react|vue|angular` pattern).
- [ ] `pnpm test` green on chromium, firefox and webkit; `pnpm typecheck` and `pnpm build` clean.
- [ ] Package README with a usage section, plus a usage section in the root README, and a changeset (`pnpm changeset`).

Tests live in `packages/<package>/tests/`, and each package has its own `tests/helpers.ts` (`mockOnLine(online)` fakes `navigator.onLine`; `setNetwork(online)` also fires the matching window event); adapters keep a small local copy on purpose, because importing helpers across packages would load a second copy of `vitest`.

## Integrations via `report()`

Sources outside the browser's own signals feed the watcher through `report(ok, rtt?)`. These are recipes for users, not shipped modules. `watcher` is the app's watcher, from `createNetworkWatcher()` or `sharedWatcher()` in `@net-watch/core`.

**Capacitor / Ionic** (native OS connectivity):

```ts
import { sharedWatcher } from '@net-watch/core'
import { Network } from '@capacitor/network'

const watcher = sharedWatcher()
Network.addListener('networkStatusChange', (s) => watcher.report(s.connected))
```

**Service worker** (sees every request, including axios and images). Add this to the app's existing SW; do not ship a second one:

```js
// sw.js: inside the app's existing fetch handling
async function notify(online) {
  for (const client of await self.clients.matchAll()) client.postMessage({ type: 'net-watch', online })
}
// page (watcher from '@net-watch/core'):
navigator.serviceWorker.addEventListener('message', (e) => {
  if (e.data?.type === 'net-watch') watcher.report(e.data.online)
})
```

**TanStack Query** (the other direction: net-watch drives Query's online manager):

```ts
import { sharedWatcher } from '@net-watch/core'
import { onlineManager } from '@tanstack/query-core'

const watcher = sharedWatcher()
watcher.subscribe((s) => onlineManager.setOnline(s.online))
```

**Electron and Tauri**: the renderer or webview is a browser, so core works unchanged.

Promote a recipe to a shipped adapter (e.g. `@net-watch/capacitor`) only when users ask for it, following the adapter contract above.
