import { afterEach, expect, test, vi } from 'vitest'
import { effectScope } from 'vue'
import { createNetworkWatcher, type NetworkWatcher } from '@net-watch/core'
import { useNetworkStatus } from '../src/index'
import { mockOnLine, setNetwork } from './helpers'

let w: NetworkWatcher | undefined
afterEach(() => {
  w?.destroy()
  w = undefined
  vi.restoreAllMocks()
})

test('tracks status and unsubscribes when the scope stops', () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const scope = effectScope()
  const status = scope.run(() => useNetworkStatus(w))!
  expect(status.value.online).toBe(true)

  setNetwork(false)
  expect(status.value.online).toBe(false)

  scope.stop()
  setNetwork(true)
  expect(status.value.online).toBe(false)
})
