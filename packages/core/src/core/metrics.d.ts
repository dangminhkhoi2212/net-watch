export type Quality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
export type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g';
export type ConnectionType = 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'none' | 'other' | 'unknown';
/** Upper smoothed-RTT bounds in ms for excellent, good and fair; anything slower is poor. */
export type RttBounds = readonly [excellent: number, good: number, fair: number];
type NetworkInformationLike = EventTarget & {
    rtt?: number;
    downlink?: number;
    effectiveType?: EffectiveType;
    type?: ConnectionType;
    saveData?: boolean;
};
/** Exponentially weighted moving average; the first sample seeds it. */
export declare const ewma: (prev: number | undefined, sample: number) => number;
/** Degrade as soon as a bound is crossed; improve only below 0.8 × the bound, so quality does not flap. */
export declare function classify(rtt: number | undefined, prev: Quality, bounds: RttBounds): Quality;
export declare const roundRtt: (ms: number) => number;
export declare const roundDownlink: (mbps: number) => number;
/** navigator.connection, which only Chromium ships. */
export declare const connection: () => NetworkInformationLike | undefined;
/** Chromium-only link info; undefined (saveData false) elsewhere. A zero estimate means "no estimate". */
export declare function connectionInfo(): {
    rtt: number | undefined;
    downlink: number | undefined;
    effectiveType: EffectiveType | undefined;
    type: ConnectionType | undefined;
    saveData: boolean;
};
/** Mbps from one Resource Timing entry; undefined for cached, tiny or opaque (no Timing-Allow-Origin) responses. */
export declare function throughputOf(entry: Pick<PerformanceResourceTiming, 'transferSize' | 'responseStart' | 'responseEnd'>): number | undefined;
/** Feeds a throughput sample for every useful resource the page loads, page-load assets included. */
export declare function observeThroughput(onSample: (mbps: number) => void): () => void;
export {};
