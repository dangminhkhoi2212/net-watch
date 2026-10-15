import { type ConnectionType, type EffectiveType, type Quality, type RttBounds } from './metrics';
export type { ConnectionType, EffectiveType, Quality, RttBounds } from './metrics';
export interface NetworkState {
    online: boolean;
    /** Date.now() of the last online/offline flip. */
    since: number;
    /** Band over smoothed RTT; every browser once sampled. */
    quality: Quality;
    /** Smoothed RTT in ms, rounded to 50. */
    rtt: number | undefined;
    /** Smoothed throughput in Mbps (Resource Timing; Chromium hint). */
    downlink: number | undefined;
    /** Chromium only. */
    effectiveType: EffectiveType | undefined;
    /** Chrome on Android / ChromeOS only. */
    type: ConnectionType | undefined;
    /** Chromium only; false elsewhere. */
    saveData: boolean;
}
export type NetworkListener = (state: NetworkState, prev: NetworkState) => void;
export interface WatcherOptions {
    /** Same-origin HTTPS endpoint answering HEAD with 204. Without it only layers 1 + 2 run. */
    pingUrl?: string;
    /** Probe timeout, ms. Default 5000. */
    timeout?: number;
    /** Backoff ceiling while offline, ms. Default 30000. */
    maxRetryDelay?: number;
    /** Opt-in idle probe interval, ms. Needs pingUrl; skipped while hidden or offline. */
    heartbeat?: number;
    /** Quality bands over smoothed RTT, ms. Default [150, 400, 1400]. */
    rttBounds?: RttBounds;
    onOnline?: (state: NetworkState) => void;
    onOffline?: (state: NetworkState) => void;
}
export interface NetworkWatcher {
    /** Same object reference until a field changes. */
    getState: () => NetworkState;
    /** Returns an unsubscribe function. */
    subscribe: (listener: NetworkListener) => () => void;
    /** Decide now; probes when pingUrl is set. Concurrent calls share one probe. */
    check: () => Promise<NetworkState>;
    /** Evidence from outside: real requests, a service worker, the native OS. */
    report: (ok: boolean, rtt?: number) => void;
    /** Resolves when online (immediately if already online). */
    waitForOnline: () => Promise<NetworkState>;
    /** Removes every listener, observer and timer. */
    destroy: () => void;
}
export declare function createNetworkWatcher(options?: WatcherOptions): NetworkWatcher;
/** Lazily created default watcher; adapters use it when no watcher is passed. */
export declare const sharedWatcher: () => NetworkWatcher;
