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
