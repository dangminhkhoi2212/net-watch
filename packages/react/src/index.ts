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
