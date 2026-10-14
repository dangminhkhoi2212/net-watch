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
