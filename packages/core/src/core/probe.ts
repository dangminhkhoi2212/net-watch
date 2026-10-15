/** One HEAD request to `url`. Resolves to the round-trip time in ms, or null on network error or timeout. */
export async function probe(url: string, timeout: number): Promise<number | null> {
  // AbortController + setTimeout instead of AbortSignal.timeout, which needs Safari 16.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const start = performance.now()
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal })
    return performance.now() - start
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
