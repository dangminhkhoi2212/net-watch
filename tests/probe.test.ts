import { afterEach, expect, test, vi } from 'vitest'
import { probe } from '../src/probe'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('resolves the round-trip time when the request completes', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)

  const rtt = await probe('/ping', 5000)

  expect(rtt).toBeTypeOf('number')
  expect(rtt).toBeGreaterThanOrEqual(0)
  expect(fetchMock).toHaveBeenCalledWith(
    '/ping',
    expect.objectContaining({ method: 'HEAD', mode: 'no-cors', cache: 'no-store' }),
  )
})

test('resolves null on a network error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  await expect(probe('/ping', 5000)).resolves.toBeNull()
})

test('resolves null when the request outlives the timeout', async () => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    ),
  )
  const result = probe('/ping', 1000)
  await vi.advanceTimersByTimeAsync(1000)
  await expect(result).resolves.toBeNull()
})
