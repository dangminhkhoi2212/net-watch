/** One HEAD request to `url`. Resolves to the round-trip time in ms, or null on network error or timeout. */
export declare function probe(url: string, timeout: number): Promise<number | null>;
