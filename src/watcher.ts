import {
  classify,
  connection,
  connectionInfo,
  ewma,
  observeThroughput,
  roundDownlink,
  roundRtt,
  type ConnectionType,
  type EffectiveType,
  type Quality,
  type RttBounds,
} from './metrics'
import { probe } from './probe'

export type { ConnectionType, EffectiveType, Quality, RttBounds } from './metrics'

export interface NetworkState {
  online: boolean
  /** Date.now() of the last online/offline flip. */
  since: number
  /** Band over smoothed RTT; every browser once sampled. */
  quality: Quality
  /** Smoothed RTT in ms, rounded to 50. */
  rtt: number | undefined
  /** Smoothed throughput in Mbps (Resource Timing; Chromium hint). */
  downlink: number | undefined
  /** Chromium only. */
  effectiveType: EffectiveType | undefined
  /** Chrome on Android / ChromeOS only. */
  type: ConnectionType | undefined
  /** Chromium only; false elsewhere. */
  saveData: boolean
}

export type NetworkListener = (state: NetworkState, prev: NetworkState) => void

export interface WatcherOptions {
  /** Same-origin HTTPS endpoint answering HEAD with 204. Without it only layers 1 + 2 run. */
  pingUrl?: string
  /** Probe timeout, ms. Default 5000. */
  timeout?: number
  /** Backoff ceiling while offline, ms. Default 30000. */
  maxRetryDelay?: number
  /** Opt-in idle probe interval, ms. Needs pingUrl; skipped while hidden or offline. */
  heartbeat?: number
  /** Quality bands over smoothed RTT, ms. Default [150, 400, 1400]. */
  rttBounds?: RttBounds
  onOnline?: (state: NetworkState) => void
  onOffline?: (state: NetworkState) => void
}

export interface NetworkWatcher {
  /** Same object reference until a field changes. */
  getState: () => NetworkState
  /** Returns an unsubscribe function. */
  subscribe: (listener: NetworkListener) => () => void
  /** Decide now; probes when pingUrl is set. Concurrent calls share one probe. */
  check: () => Promise<NetworkState>
  /** Evidence from outside: real requests, a service worker, the native OS. */
  report: (ok: boolean, rtt?: number) => void
  /** Resolves when online (immediately if already online). */
  waitForOnline: () => Promise<NetworkState>
  /** Removes every listener, observer and timer. */
  destroy: () => void
}

const isBrowser = typeof window !== 'undefined'
const DEFAULT_BOUNDS: RttBounds = [150, 400, 1400]
const FIELDS = ['online', 'quality', 'rtt', 'downlink', 'effectiveType', 'type', 'saveData'] as const
const FIRST_RETRY = 2000

export function createNetworkWatcher(options: WatcherOptions = {}): NetworkWatcher {
  const {
    pingUrl,
    timeout = 5000,
    maxRetryDelay = 30_000,
    heartbeat,
    rttBounds = DEFAULT_BOUNDS,
    onOnline,
    onOffline,
  } = options
  const listeners = new Set<NetworkListener>()
  const info = connectionInfo()
  const startOnline = isBrowser ? navigator.onLine : true
  // Smoothed, unrounded averages; the state carries rounded values.
  let rttAvg = startOnline ? info.rtt : undefined
  let downlinkAvg = startOnline ? info.downlink : undefined
  let inFlight: Promise<NetworkState> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryDelay = FIRST_RETRY
  let destroyed = false

  const metrics = (prevQuality: Quality) => ({
    quality: classify(rttAvg, prevQuality, rttBounds),
    rtt: rttAvg === undefined ? undefined : roundRtt(rttAvg),
    downlink: downlinkAvg === undefined ? undefined : roundDownlink(downlinkAvg),
  })

  let state: NetworkState = {
    online: startOnline,
    since: Date.now(),
    ...metrics('unknown'),
    effectiveType: info.effectiveType,
    type: info.type,
    saveData: info.saveData,
  }

  const update = (patch: Partial<NetworkState>) => {
    const prev = state
    const next = { ...prev, ...patch }
    if (FIELDS.every((key) => next[key] === prev[key])) return
    if (next.online !== prev.online) next.since = Date.now()
    state = next
    if (next.online !== prev.online) (next.online ? onOnline : onOffline)?.(next)
    for (const listener of listeners) listener(next, prev)
  }

  const stopRetry = () => {
    clearTimeout(retryTimer)
    retryTimer = undefined
    retryDelay = FIRST_RETRY
  }

  const goOnline = (sample?: number) => {
    stopRetry()
    if (sample !== undefined) rttAvg = ewma(rttAvg, sample)
    update({ online: true, ...metrics(state.quality) })
  }

  const goOffline = () => {
    rttAvg = undefined
    downlinkAvg = undefined
    update({ online: false, ...metrics('unknown') })
    scheduleRetry()
  }

  const sampleDownlink = (mbps: number) => {
    if (!state.online) return
    downlinkAvg = ewma(downlinkAvg, mbps)
    update(metrics(state.quality))
  }

  const check = (): Promise<NetworkState> => {
    if (!isBrowser) return Promise.resolve(state)
    if (!navigator.onLine) {
      goOffline()
      return Promise.resolve(state)
    }
    if (!pingUrl) {
      goOnline()
      return Promise.resolve(state)
    }
    return (inFlight ??= probe(pingUrl, timeout).then((sample) => {
      inFlight = undefined
      if (destroyed) return state
      if (sample === null) goOffline()
      else goOnline(sample)
      return state
    }))
  }

  function scheduleRetry() {
    if (destroyed || !pingUrl || retryTimer !== undefined) return
    retryTimer = setTimeout(() => {
      retryTimer = undefined
      retryDelay = Math.min(retryDelay * 2, maxRetryDelay)
      void check()
    }, retryDelay)
  }

  const report = (ok: boolean, sample?: number) => {
    if (ok) goOnline(sample)
    else if (pingUrl) void check()
  }

  const subscribe = (listener: NetworkListener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const waitForOnline = () =>
    state.online
      ? Promise.resolve(state)
      : new Promise<NetworkState>((resolve) => {
          const off = subscribe((s) => {
            if (s.online) {
              off()
              resolve(s)
            }
          })
        })

  const recheck = () => {
    void check()
  }
  const handleOffline = () => goOffline()
  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) recheck()
  }
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') recheck()
  }
  const conn = connection()
  const handleConnection = () => {
    const c = connectionInfo()
    if (state.online) {
      if (c.rtt !== undefined) rttAvg = ewma(rttAvg, c.rtt)
      if (c.downlink !== undefined) downlinkAvg = ewma(downlinkAvg, c.downlink)
    }
    update({ ...metrics(state.quality), effectiveType: c.effectiveType, type: c.type, saveData: c.saveData })
  }

  let stopThroughput = () => {}
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined
  if (isBrowser) {
    window.addEventListener('online', recheck)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)
    conn?.addEventListener('change', handleConnection)
    stopThroughput = observeThroughput(sampleDownlink)
    if (pingUrl && heartbeat) {
      heartbeatTimer = setInterval(() => {
        if (state.online && document.visibilityState === 'visible') recheck()
      }, heartbeat)
    }
    recheck() // startup is a suspect
  }

  return {
    getState: () => state,
    subscribe,
    check,
    report,
    waitForOnline,
    destroy() {
      destroyed = true
      if (isBrowser) {
        window.removeEventListener('online', recheck)
        window.removeEventListener('offline', handleOffline)
        window.removeEventListener('pageshow', handlePageShow)
        document.removeEventListener('visibilitychange', handleVisibility)
        conn?.removeEventListener('change', handleConnection)
      }
      clearInterval(heartbeatTimer)
      stopRetry()
      stopThroughput()
      listeners.clear()
    },
  }
}

let shared: NetworkWatcher | undefined
/** Lazily created default watcher; adapters use it when no watcher is passed. */
export const sharedWatcher = (): NetworkWatcher => (shared ??= createNetworkWatcher())
