import { expect, test, vi } from 'vitest'
import { watchFetch, type NetworkWatcher } from '../src'

const fakeWatcher = () => {
  const report = vi.fn()
  return { report, watcher: { report } as unknown as NetworkWatcher }
}

test('a response reports online with the time to headers', async () => {
  const { report, watcher } = fakeWatcher()
  const res = new Response('ok')
  const f = watchFetch(watcher, vi.fn().mockResolvedValue(res))
  await expect(f('/api')).resolves.toBe(res)
  expect(report).toHaveBeenCalledExactlyOnceWith(true, expect.any(Number))
})

test('an HTTP error still proves the network is up', async () => {
  const { report, watcher } = fakeWatcher()
  const f = watchFetch(watcher, vi.fn().mockResolvedValue(new Response(null, { status: 503 })))
  await f('/api')
  expect(report).toHaveBeenCalledWith(true, expect.any(Number))
})

test('a network error (TypeError in every engine) reports a suspicion and rethrows', async () => {
  const { report, watcher } = fakeWatcher()
  const error = new TypeError('Load failed')
  const f = watchFetch(watcher, vi.fn().mockRejectedValue(error))
  await expect(f('/api')).rejects.toBe(error)
  expect(report).toHaveBeenCalledExactlyOnceWith(false)
})

test('an aborted request reports nothing and rethrows', async () => {
  const { report, watcher } = fakeWatcher()
  const error = new DOMException('Aborted', 'AbortError')
  const f = watchFetch(watcher, vi.fn().mockRejectedValue(error))
  await expect(f('/api')).rejects.toBe(error)
  expect(report).not.toHaveBeenCalled()
})

test('passes input and init through', async () => {
  const { watcher } = fakeWatcher()
  const base = vi.fn().mockResolvedValue(new Response(null))
  const init = { method: 'POST', body: 'x' }
  await watchFetch(watcher, base)('/api', init)
  expect(base).toHaveBeenCalledWith('/api', init)
})

test('a throwing report(true) does not turn a successful fetch into a failure', async () => {
  const rethrow = vi.spyOn(globalThis, 'setTimeout').mockImplementation((() => 0) as never)
  const report = vi.fn((ok: boolean) => {
    if (ok) throw new TypeError('listener bug')
  })
  const res = new Response('ok')
  const f = watchFetch({ report } as unknown as NetworkWatcher, vi.fn().mockResolvedValue(res))
  await expect(f('/api')).resolves.toBe(res)
  expect(report).not.toHaveBeenCalledWith(false)
  expect(rethrow).toHaveBeenCalledOnce() // the listener error resurfaces out of band
  rethrow.mockRestore()
})
