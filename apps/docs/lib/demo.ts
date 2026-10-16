import { createNetworkWatcher, type NetworkState } from '@net-watch/core';
import { watchFetch } from '@net-watch/core/fetch';

/**
 * The watcher behind the landing page. The page eats its own cooking: the accent colour, the banner and the
 * live panel all read this one instance, configured the way the docs recommend (a same-origin ping endpoint).
 */
export const demoWatcher = createNetworkWatcher({ pingUrl: '/api/ping', heartbeat: 15_000 });

// Requests go through watchFetch, so net-watch sees them exactly as it would in your app.
const tracked = watchFetch(demoWatcher);

function createStore<T>(initial: T) {
  let value = initial;
  const subscribers = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      subscribers.forEach((notify) => notify());
    },
    subscribe(notify: () => void) {
      subscribers.add(notify);
      return () => {
        subscribers.delete(notify);
      };
    },
  };
}

export interface RawSample {
  t: number;
  ms: number;
}
export interface SmoothedPoint {
  t: number;
  rtt: number;
}

const MAX_POINTS = 80;
export const EMPTY: readonly never[] = [];

/** Time to first byte of each request the panel sent: what watchFetch hands to the watcher. */
export const rawSamples = createStore<readonly RawSample[]>(EMPTY);
/** The watcher's own smoothed `rtt`, one point per visible change. */
export const smoothedPoints = createStore<readonly SmoothedPoint[]>(EMPTY);

function push<T>(store: ReturnType<typeof createStore<readonly T[]>>, item: T) {
  store.set([...store.get(), item].slice(-MAX_POINTS));
}

if (typeof window !== 'undefined') {
  const remember = (state: NetworkState) => {
    if (state.rtt !== undefined) push(smoothedPoints, { t: Date.now(), rtt: state.rtt });
  };
  remember(demoWatcher.getState());
  demoWatcher.subscribe(remember);
}

/** Sends one request through net-watch and records how long the first byte took. Resolves undefined when it fails. */
export async function sendRequest(path: string) {
  const start = performance.now();
  try {
    const response = await tracked(path, { cache: 'no-store' });
    const ms = performance.now() - start;
    push(rawSamples, { t: Date.now(), ms });
    return { ms, response };
  } catch {
    return undefined;
  }
}

export interface SpeedResult {
  /** Median time to first byte over several tiny requests, ms. */
  latency: number;
  /** Throughput of a 1 MB download after the first byte, Mbps. */
  download: number | undefined;
}

/** Six tiny requests for latency, then one 1 MB download for throughput. */
export async function runSpeedCheck(): Promise<SpeedResult | undefined> {
  const times: number[] = [];
  for (let i = 0; i < 6; i++) {
    const result = await sendRequest('/api/ping');
    if (result) times.push(result.ms);
  }
  if (times.length === 0) return undefined;
  times.sort((a, b) => a - b);
  const latency = times[Math.floor(times.length / 2)] ?? 0;

  let download: number | undefined;
  try {
    const response = await tracked('/api/payload?kb=1024', { cache: 'no-store' });
    const firstByte = performance.now();
    const bytes = (await response.arrayBuffer()).byteLength;
    const elapsed = performance.now() - firstByte;
    if (elapsed > 1) download = (bytes * 8) / elapsed / 1000;
  } catch {
    // The connection dropped mid-test: report latency only.
  }
  return { latency, download };
}

/** Fires the same event a browser fires when the network goes away. net-watch then confirms with its probe. */
export function simulateOffline() {
  window.dispatchEvent(new Event('offline'));
}

export type Tone = 'good' | 'slow' | 'bad' | 'idle';

export function toneOf(state: NetworkState): Tone {
  if (!state.online) return 'bad';
  switch (state.quality) {
    case 'excellent':
    case 'good':
      return 'good';
    case 'fair':
      return 'slow';
    case 'poor':
      return 'bad';
    default:
      return 'idle';
  }
}
