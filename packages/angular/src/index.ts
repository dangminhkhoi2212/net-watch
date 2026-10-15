import { DestroyRef, inject, signal, type Signal } from '@angular/core'
import { sharedWatcher, type NetworkState, type NetworkWatcher } from '@net-watch/core'

/** Call in an injection context (constructor or field initializer). */
export function injectNetworkStatus(watcher: NetworkWatcher = sharedWatcher()): Signal<NetworkState> {
  const state = signal(watcher.getState())
  const off = watcher.subscribe((s) => state.set(s))
  inject(DestroyRef).onDestroy(off)
  return state.asReadonly()
}
