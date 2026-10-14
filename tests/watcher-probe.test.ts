import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createNetworkWatcher, type NetworkWatcher } from '../src'
import { fakePerformanceObserver, mockConnection, mockOnLine, setNetwork } from './helpers'

const ok = () => new Response(null, { status: 204 })
const networkError = () => new TypeError('Failed to fetch')
const visible = (state: DocumentVisibilityState) =>
  vi.spyOn(Document.prototype, 'visibilityState', 'get').mockReturnValue(state)

let w: NetworkWatcher | undefined
let restoreConnection: () => void
beforeEach(() => {
  mockOnLine(true)
  restoreConnection = mockConnection(undefined)
  fakePerformanceObserver()
})
afterEach(() => {
  w?.destroy()
  w = undefined
  restoreConnection()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('probes once at startup and goes online with an rtt sample', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  const state = await w.check()
  expect(state).toMatchObject({ online: true, quality: 'excellent' })
  expect(state.rtt).toBeTypeOf('number')
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('offline when the probe fails even though navigator.onLine is true', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError()))
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await expect(w.check()).resolves.toMatchObject({ online: false, quality: 'unknown', rtt: undefined })
})

test('skips the probe when navigator.onLine is false', async () => {
  mockOnLine(false)
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await expect(w.check()).resolves.toMatchObject({ online: false })
  expect(fetchMock).not.toHaveBeenCalled()
})

test('runs at most one probe at a time', async () => {
  let finish: ((r: Response) => void) | undefined
  const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (finish = resolve)))
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  const a = w.check()
  const b = w.check()
  expect(a).toBe(b)
  expect(fetchMock).toHaveBeenCalledOnce()
  finish?.(ok())
  await expect(a).resolves.toMatchObject({ online: true })
})

const suspectTrigger = (name: string, trigger: () => void) =>
  test(`${name} triggers a confirming probe`, async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok())
    vi.stubGlobal('fetch', fetchMock)
    w = createNetworkWatcher({ pingUrl: '/ping' })
    await w.check()
    fetchMock.mockRejectedValue(networkError())
    trigger()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await expect(w.check()).resolves.toMatchObject({ online: false })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

suspectTrigger('report(false)', () => w?.report(false))
suspectTrigger('the online event', () => setNetwork(true))
suspectTrigger('pageshow from the bfcache', () =>
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
)
suspectTrigger('the tab becoming visible', () => {
  visible('visible')
  document.dispatchEvent(new Event('visibilitychange'))
})

test('sends no requests while online and idle without heartbeat', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await w.check()
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('retries while offline at 2s, 4s, 8s, 16s, then capped at 30s', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockRejectedValue(networkError())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await w.check()
  expect(fetchMock).toHaveBeenCalledTimes(1)

  const schedule: Array<[delay: number, calls: number]> = [
    [2000, 2],
    [4000, 3],
    [8000, 4],
    [16000, 5],
    [30000, 6],
    [30000, 7],
  ]
  for (const [delay, calls] of schedule) {
    await vi.advanceTimersByTimeAsync(delay - 1)
    expect(fetchMock).toHaveBeenCalledTimes(calls - 1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(calls)
  }
})

test('stops retrying once a retry succeeds', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockRejectedValue(networkError())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await w.check()
  fetchMock.mockResolvedValue(ok())
  await vi.advanceTimersByTimeAsync(2000)
  expect(w.getState().online).toBe(true)
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('report(true) while offline goes online and cancels retries', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockRejectedValue(networkError())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await w.check()
  w.report(true, 50)
  expect(w.getState()).toMatchObject({ online: true, quality: 'excellent', rtt: 50 })
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('destroy cancels pending retries', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockRejectedValue(networkError())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping' })
  await w.check()
  w.destroy()
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('heartbeat probes while online and visible', async () => {
  vi.useFakeTimers()
  visible('visible')
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping', heartbeat: 60_000 })
  await w.check()
  await vi.advanceTimersByTimeAsync(60_000)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  await vi.advanceTimersByTimeAsync(60_000)
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

test('heartbeat catches a connection that dies while the app is idle', async () => {
  vi.useFakeTimers()
  visible('visible')
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping', heartbeat: 60_000 })
  await w.check()
  fetchMock.mockRejectedValue(networkError())
  await vi.advanceTimersByTimeAsync(60_000)
  expect(w.getState().online).toBe(false)
})

test('heartbeat skips hidden tabs', async () => {
  vi.useFakeTimers()
  visible('hidden')
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping', heartbeat: 60_000 })
  await w.check()
  await vi.advanceTimersByTimeAsync(180_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('destroy stops the heartbeat', async () => {
  vi.useFakeTimers()
  visible('visible')
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  w = createNetworkWatcher({ pingUrl: '/ping', heartbeat: 60_000 })
  await w.check()
  w.destroy()
  await vi.advanceTimersByTimeAsync(180_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('destroy during an in-flight probe stops everything', async () => {
  vi.useFakeTimers()
  let fail: ((e: Error) => void) | undefined
  const fetchMock = vi.fn(() => new Promise<Response>((_, reject) => (fail = reject)))
  vi.stubGlobal('fetch', fetchMock)
  const onOffline = vi.fn()
  w = createNetworkWatcher({ pingUrl: '/ping', onOffline })
  const pending = w.check()
  w.destroy()
  fail?.(networkError())
  await pending
  expect(onOffline).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledOnce()
})
