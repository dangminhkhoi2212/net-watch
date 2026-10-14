import { afterEach, expect, test, vi } from 'vitest'
import {
  classify,
  connectionInfo,
  ewma,
  observeThroughput,
  roundDownlink,
  roundRtt,
  throughputOf,
  type RttBounds,
} from '../src/metrics'
import { fakeConnection, fakePerformanceObserver, mockConnection } from './helpers'

const BOUNDS: RttBounds = [150, 400, 1400]

let restore: (() => void) | undefined
afterEach(() => {
  restore?.()
  restore = undefined
  vi.unstubAllGlobals()
})

test('ewma seeds with the first sample, then smooths with alpha 0.3', () => {
  expect(ewma(undefined, 100)).toBe(100)
  expect(ewma(100, 200)).toBeCloseTo(130)
})

test('classify without samples is unknown', () => {
  expect(classify(undefined, 'good', BOUNDS)).toBe('unknown')
})

test('classify from unknown picks the band', () => {
  expect(classify(100, 'unknown', BOUNDS)).toBe('excellent')
  expect(classify(200, 'unknown', BOUNDS)).toBe('good')
  expect(classify(500, 'unknown', BOUNDS)).toBe('fair')
  expect(classify(1399, 'unknown', BOUNDS)).toBe('fair')
  expect(classify(1400, 'unknown', BOUNDS)).toBe('poor')
})

test('classify degrades as soon as a bound is crossed', () => {
  expect(classify(150, 'excellent', BOUNDS)).toBe('good')
  expect(classify(1400, 'fair', BOUNDS)).toBe('poor')
  expect(classify(2000, 'excellent', BOUNDS)).toBe('poor')
})

test('classify improves only below 0.8 × the bound', () => {
  expect(classify(130, 'good', BOUNDS)).toBe('good')
  expect(classify(119, 'good', BOUNDS)).toBe('excellent')
  expect(classify(1200, 'poor', BOUNDS)).toBe('poor')
  expect(classify(1100, 'poor', BOUNDS)).toBe('fair')
  expect(classify(100, 'poor', BOUNDS)).toBe('excellent')
})

test('classify honours custom bounds', () => {
  expect(classify(150, 'unknown', [50, 100, 200])).toBe('fair')
})

test('roundRtt rounds to 50 ms', () => {
  expect(roundRtt(0)).toBe(0)
  expect(roundRtt(74)).toBe(50)
  expect(roundRtt(75)).toBe(100)
  expect(roundRtt(1129)).toBe(1150)
})

test('roundDownlink keeps 0.1 Mbps below 10 and whole Mbps above', () => {
  expect(roundDownlink(0.04)).toBe(0)
  expect(roundDownlink(1.55)).toBe(1.6)
  expect(roundDownlink(9.94)).toBe(9.9)
  expect(roundDownlink(12.4)).toBe(12)
})

test('connectionInfo is empty where navigator.connection is missing (Firefox, Safari)', () => {
  restore = mockConnection(undefined)
  expect(connectionInfo()).toEqual({
    rtt: undefined,
    downlink: undefined,
    effectiveType: undefined,
    type: undefined,
    saveData: false,
  })
})

test('connectionInfo reads every field and treats zero estimates as unknown', () => {
  restore = mockConnection(
    fakeConnection({ rtt: 300, downlink: 2.5, effectiveType: '3g', type: 'cellular', saveData: true }),
  )
  expect(connectionInfo()).toEqual({ rtt: 300, downlink: 2.5, effectiveType: '3g', type: 'cellular', saveData: true })
  restore()
  restore = mockConnection(fakeConnection({ rtt: 0, downlink: 0 }))
  expect(connectionInfo()).toMatchObject({ rtt: undefined, downlink: undefined })
})

test('throughputOf turns a large transfer into Mbps and skips useless entries', () => {
  expect(throughputOf({ transferSize: 1_000_000, responseStart: 0, responseEnd: 1000 })).toBe(8)
  expect(throughputOf({ transferSize: 49_999, responseStart: 0, responseEnd: 10 })).toBeUndefined()
  expect(throughputOf({ transferSize: 0, responseStart: 0, responseEnd: 10 })).toBeUndefined()
  expect(throughputOf({ transferSize: 100_000, responseStart: 5, responseEnd: 5 })).toBeUndefined()
})

test('observeThroughput observes buffered resource entries and stops on demand', () => {
  const perf = fakePerformanceObserver()
  const samples: number[] = []
  const stop = observeThroughput((mbps) => samples.push(mbps))
  expect(perf.observe).toHaveBeenCalledWith({ type: 'resource', buffered: true })

  perf.emit([
    { transferSize: 1_000_000, responseStart: 0, responseEnd: 1000 },
    { transferSize: 10, responseStart: 0, responseEnd: 1 },
  ])
  expect(samples).toEqual([8])

  stop()
  expect(perf.disconnect).toHaveBeenCalledOnce()
})
