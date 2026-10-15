import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createNetworkWatcher, sharedWatcher, type NetworkWatcher } from '../src'
import { fakeConnection, fakePerformanceObserver, mockConnection, mockOnLine, setNetwork } from './helpers'

let w: NetworkWatcher | undefined
let restoreConnection: () => void
let perf: ReturnType<typeof fakePerformanceObserver>
beforeEach(() => {
  mockOnLine(true)
  restoreConnection = mockConnection(undefined)
  perf = fakePerformanceObserver()
})
afterEach(() => {
  w?.destroy()
  w = undefined
  restoreConnection()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('initial state follows navigator.onLine, with every metric unknown', () => {
  mockOnLine(false)
  w = createNetworkWatcher()
  expect(w.getState()).toEqual({
    online: false,
    since: expect.any(Number),
    quality: 'unknown',
    rtt: undefined,
    downlink: undefined,
    effectiveType: undefined,
    type: undefined,
    saveData: false,
  })
})

test('offline event notifies listeners with new and previous state', () => {
  w = createNetworkWatcher()
  const listener = vi.fn()
  w.subscribe(listener)
  const before = w.getState()

  setNetwork(false)

  expect(w.getState().online).toBe(false)
  expect(w.getState().since).toBeGreaterThanOrEqual(before.since)
  expect(listener).toHaveBeenCalledExactlyOnceWith(w.getState(), before)
})

test('no change keeps the same state object and notifies nobody', () => {
  w = createNetworkWatcher()
  const listener = vi.fn()
  w.subscribe(listener)
  const before = w.getState()
  setNetwork(true)
  expect(listener).not.toHaveBeenCalled()
  expect(w.getState()).toBe(before)
})

test('onOnline / onOffline run before listeners', () => {
  const calls: string[] = []
  w = createNetworkWatcher({
    onOnline: () => calls.push('onOnline'),
    onOffline: () => calls.push('onOffline'),
  })
  w.subscribe((s) => calls.push(`listener:${s.online}`))
  setNetwork(false)
  setNetwork(true)
  expect(calls).toEqual(['onOffline', 'listener:false', 'onOnline', 'listener:true'])
})

test('unsubscribe stops notifications', () => {
  w = createNetworkWatcher()
  const listener = vi.fn()
  w.subscribe(listener)()
  setNetwork(false)
  expect(listener).not.toHaveBeenCalled()
})

test('waitForOnline resolves immediately when online, or once back online', async () => {
  w = createNetworkWatcher()
  await expect(w.waitForOnline()).resolves.toMatchObject({ online: true })
  setNetwork(false)
  const wait = w.waitForOnline()
  setNetwork(true)
  await expect(wait).resolves.toMatchObject({ online: true })
})

test('report(true) wins over navigator.onLine === false', () => {
  mockOnLine(false)
  w = createNetworkWatcher()
  w.report(true)
  expect(w.getState().online).toBe(true)
})

test('report(false) is ignored without pingUrl', () => {
  w = createNetworkWatcher()
  w.report(false)
  expect(w.getState().online).toBe(true)
})

test('rtt samples drive quality bands with hysteresis', () => {
  w = createNetworkWatcher()
  w.report(true, 100) // avg 100
  expect(w.getState()).toMatchObject({ quality: 'excellent', rtt: 100 })
  w.report(true, 2000) // avg 670
  expect(w.getState()).toMatchObject({ quality: 'fair', rtt: 650 })
  w.report(true, 100) // avg 499
  expect(w.getState()).toMatchObject({ quality: 'fair', rtt: 500 })
  w.report(true, 100) // avg 379.3: inside good, but not below 0.8 × 400
  expect(w.getState()).toMatchObject({ quality: 'fair', rtt: 400 })
  w.report(true, 100) // avg 295.5: below 320
  expect(w.getState()).toMatchObject({ quality: 'good', rtt: 300 })
})

test('custom rttBounds', () => {
  w = createNetworkWatcher({ rttBounds: [50, 100, 200] })
  w.report(true, 150)
  expect(w.getState().quality).toBe('fair')
})

test('samples that round to the same values notify nobody', () => {
  w = createNetworkWatcher()
  w.report(true, 100)
  const listener = vi.fn()
  w.subscribe(listener)
  w.report(true, 110) // avg 103 → 100
  w.report(true, 90) // avg 99.1 → 100
  expect(listener).not.toHaveBeenCalled()
})

test('downlink comes from Resource Timing samples, smoothed', () => {
  w = createNetworkWatcher()
  perf.emit([{ transferSize: 1_000_000, responseStart: 0, responseEnd: 1000 }]) // 8 Mbps
  expect(w.getState().downlink).toBe(8)
  perf.emit([{ transferSize: 1_000_000, responseStart: 0, responseEnd: 4000 }]) // 2 Mbps → avg 6.2
  expect(w.getState().downlink).toBe(6.2)
})

test('going offline resets quality, rtt and downlink, and ignores samples until back online', () => {
  w = createNetworkWatcher()
  w.report(true, 100)
  perf.emit([{ transferSize: 1_000_000, responseStart: 0, responseEnd: 1000 }])
  setNetwork(false)
  expect(w.getState()).toMatchObject({ quality: 'unknown', rtt: undefined, downlink: undefined })
  perf.emit([{ transferSize: 1_000_000, responseStart: 0, responseEnd: 1000 }])
  expect(w.getState().downlink).toBeUndefined()
})

test('navigator.connection seeds every field; its change event refreshes them', () => {
  restoreConnection()
  const conn = fakeConnection({ rtt: 2000, downlink: 1.55, effectiveType: '3g', type: 'cellular', saveData: false })
  restoreConnection = mockConnection(conn)
  w = createNetworkWatcher()
  expect(w.getState()).toMatchObject({
    quality: 'poor',
    rtt: 2000,
    downlink: 1.6,
    effectiveType: '3g',
    type: 'cellular',
    saveData: false,
  })

  Object.assign(conn, { rtt: 0, downlink: 0, effectiveType: '4g', type: 'wifi', saveData: true })
  conn.dispatchEvent(new Event('change'))
  expect(w.getState()).toMatchObject({ rtt: 2000, effectiveType: '4g', type: 'wifi', saveData: true })
})

test('pageshow from the back/forward cache re-checks', () => {
  w = createNetworkWatcher()
  mockOnLine(false)
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
  expect(w.getState().online).toBe(false)
})

test('tab becoming visible re-checks', () => {
  w = createNetworkWatcher()
  mockOnLine(false)
  vi.spyOn(Document.prototype, 'visibilityState', 'get').mockReturnValue('visible')
  document.dispatchEvent(new Event('visibilitychange'))
  expect(w.getState().online).toBe(false)
})

test('destroy stops listening and disconnects the throughput observer', () => {
  w = createNetworkWatcher()
  w.destroy()
  setNetwork(false)
  expect(w.getState().online).toBe(true)
  expect(perf.disconnect).toHaveBeenCalledOnce()
})

test('sharedWatcher returns one instance', () => {
  expect(sharedWatcher()).toBe(sharedWatcher())
})

test('a throwing listener does not stop later listeners or the offline retry', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  const second = vi.fn()
  w.subscribe(() => {
    throw new Error('boom')
  })
  w.subscribe(second)

  await w.check()
  expect(w.getState().online).toBe(false)
  expect(second).toHaveBeenCalledOnce()

  // The error resurfaces asynchronously; the retry timer still fires.
  await expect(vi.advanceTimersByTimeAsync(2000)).rejects.toThrow('boom')
  expect(fetchMock).toHaveBeenCalledTimes(2)
  vi.useRealTimers()
})
