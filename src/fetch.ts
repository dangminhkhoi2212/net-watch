import type { NetworkWatcher } from './watcher'

/** Wraps fetch so real requests feed the watcher: responses prove online, network errors raise suspicion. */
export function watchFetch(watcher: NetworkWatcher, baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const start = performance.now()
    try {
      const res = await baseFetch(input, init)
      // fetch resolves at headers, so this is time-to-headers regardless of body size.
      watcher.report(true, performance.now() - start)
      return res
    } catch (err) {
      // Network failures are a TypeError in every engine; the message differs, so never match on it.
      if (err instanceof TypeError) watcher.report(false)
      throw err
    }
  }
}
