import '@angular/compiler'
import { Injector, runInInjectionContext } from '@angular/core'
import { afterEach, expect, test, vi } from 'vitest'
import { createNetworkWatcher, type NetworkWatcher } from '@net-watch/core'
import { injectNetworkStatus } from '../src/index'
import { mockOnLine, setNetwork } from './helpers'

let w: NetworkWatcher | undefined
afterEach(() => {
  w?.destroy()
  w = undefined
  vi.restoreAllMocks()
})

test('tracks status as a signal and unsubscribes on destroy', () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  // An environment injector is its own DestroyRef.
  const injector = Injector.create({ providers: [] }) as Injector & { destroy: () => void }
  const status = runInInjectionContext(injector, () => injectNetworkStatus(w))
  expect(status().online).toBe(true)

  setNetwork(false)
  expect(status().online).toBe(false)

  injector.destroy()
  setNetwork(true)
  expect(status().online).toBe(false)
})
