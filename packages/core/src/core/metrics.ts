export type Quality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
export type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g'
export type ConnectionType = 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'none' | 'other' | 'unknown'
/** Upper smoothed-RTT bounds in ms for excellent, good and fair; anything slower is poor. */
export type RttBounds = readonly [excellent: number, good: number, fair: number]

type Band = Exclude<Quality, 'unknown'>
type NetworkInformationLike = EventTarget & {
  rtt?: number
  downlink?: number
  effectiveType?: EffectiveType
  type?: ConnectionType
  saveData?: boolean
}

const ALPHA = 0.3
const IMPROVE_RATIO = 0.8
const MIN_TRANSFER_BYTES = 50_000
const RANK: Record<Band, number> = { excellent: 0, good: 1, fair: 2, poor: 3 }

/** Exponentially weighted moving average; the first sample seeds it. */
export const ewma = (prev: number | undefined, sample: number): number =>
  prev === undefined ? sample : prev * (1 - ALPHA) + sample * ALPHA

function bandOf(rtt: number, [excellent, good, fair]: RttBounds, scale = 1): Band {
  if (rtt < excellent * scale) return 'excellent'
  if (rtt < good * scale) return 'good'
  if (rtt < fair * scale) return 'fair'
  return 'poor'
}

/** Degrade as soon as a bound is crossed; improve only below 0.8 × the bound, so quality does not flap. */
export function classify(rtt: number | undefined, prev: Quality, bounds: RttBounds): Quality {
  if (rtt === undefined) return 'unknown'
  const plain = bandOf(rtt, bounds)
  if (prev === 'unknown' || RANK[plain] > RANK[prev]) return plain
  const strict = bandOf(rtt, bounds, IMPROVE_RATIO)
  return RANK[strict] < RANK[prev] ? strict : prev
}

export const roundRtt = (ms: number): number => Math.round(ms / 50) * 50

export const roundDownlink = (mbps: number): number => (mbps < 10 ? Math.round(mbps * 10) / 10 : Math.round(mbps))

/** navigator.connection, which only Chromium ships. */
export const connection = (): NetworkInformationLike | undefined =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformationLike }).connection

/** Chromium-only link info; undefined (saveData false) elsewhere. A zero estimate means "no estimate". */
export function connectionInfo() {
  const c = connection()
  return {
    rtt: c?.rtt || undefined,
    downlink: c?.downlink || undefined,
    effectiveType: c?.effectiveType,
    type: c?.type,
    saveData: c?.saveData ?? false,
  }
}

/** Mbps from one Resource Timing entry; undefined for cached, tiny or opaque (no Timing-Allow-Origin) responses. */
export function throughputOf(
  entry: Pick<PerformanceResourceTiming, 'transferSize' | 'responseStart' | 'responseEnd'>,
): number | undefined {
  const ms = entry.responseEnd - entry.responseStart
  if (entry.transferSize < MIN_TRANSFER_BYTES || ms <= 0) return undefined
  return (entry.transferSize * 8) / ms / 1000
}

/** Feeds a throughput sample for every useful resource the page loads, page-load assets included. */
export function observeThroughput(onSample: (mbps: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {}
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      const mbps = throughputOf(entry)
      if (mbps !== undefined) onSample(mbps)
    }
  })
  observer.observe({ type: 'resource', buffered: true })
  return () => observer.disconnect()
}
