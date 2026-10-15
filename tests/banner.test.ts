import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createBanner, createNetworkWatcher, type NetworkWatcher } from '../src'
import { fakePerformanceObserver, mockConnection, mockOnLine, setNetwork } from './helpers'

let w: NetworkWatcher | undefined
let banner: { destroy: () => void } | undefined
let restoreConnection: () => void
const el = () => document.querySelector<HTMLElement>('.netwatch-banner')!

beforeEach(() => {
  mockOnLine(true)
  restoreConnection = mockConnection(undefined)
  fakePerformanceObserver()
})
afterEach(() => {
  banner?.destroy()
  banner = undefined
  w?.destroy()
  w = undefined
  restoreConnection()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('starting offline shows the offline message', () => {
  mockOnLine(false)
  w = createNetworkWatcher()
  banner = createBanner(w)
  expect(el().hidden).toBe(false)
  expect(el().textContent).toBe('You are offline')
  expect(el().getAttribute('role')).toBe('status')
  expect(el().dataset['state']).toBe('offline')
})

test('starting online stays hidden', () => {
  w = createNetworkWatcher()
  banner = createBanner(w)
  expect(el().hidden).toBe(true)
})

test('offline, then back online, then auto-hide', () => {
  vi.useFakeTimers()
  w = createNetworkWatcher()
  banner = createBanner(w, { hideAfter: 1000 })

  setNetwork(false)
  expect(el().hidden).toBe(false)
  expect(el().textContent).toBe('You are offline')

  setNetwork(true)
  expect(el().textContent).toBe('Back online')
  expect(el().dataset['state']).toBe('online')

  vi.advanceTimersByTime(1000)
  expect(el().hidden).toBe(true)
})

test('going offline again cancels the pending hide', () => {
  vi.useFakeTimers()
  w = createNetworkWatcher()
  banner = createBanner(w, { hideAfter: 1000 })
  setNetwork(false)
  setNetwork(true)
  setNetwork(false)
  vi.advanceTimersByTime(1000)
  expect(el().hidden).toBe(false)
  expect(el().textContent).toBe('You are offline')
})

test('poor quality is ignored without slowText', () => {
  w = createNetworkWatcher()
  banner = createBanner(w)
  w.report(true, 5000)
  expect(w.getState().quality).toBe('poor')
  expect(el().hidden).toBe(true)
})

test('poor quality shows slowText, and leaving poor hides at once', () => {
  w = createNetworkWatcher()
  banner = createBanner(w, { slowText: 'Slow connection' })
  w.report(true, 5000)
  expect(el().hidden).toBe(false)
  expect(el().textContent).toBe('Slow connection')
  expect(el().dataset['state']).toBe('slow')

  for (let i = 0; i < 5; i++) w.report(true, 1) // avg 5000 → 841, below 0.8 × 1400
  expect(w.getState().quality).toBe('fair')
  expect(el().hidden).toBe(true)
})

test('custom texts, position and container', () => {
  mockOnLine(false)
  const container = document.createElement('section')
  document.body.append(container)
  w = createNetworkWatcher()
  banner = createBanner(w, { offlineText: 'Mất kết nối mạng', position: 'top', container })
  expect(container.querySelector('.netwatch-banner')?.textContent).toBe('Mất kết nối mạng')
  expect(el().dataset['position']).toBe('top')
  banner.destroy()
  container.remove()
})

test('injects the default stylesheet once', () => {
  w = createNetworkWatcher()
  banner = createBanner(w)
  const second = createBanner(w)
  expect(document.querySelectorAll('#netwatch-style')).toHaveLength(1)
  second.destroy()
})

test('destroy removes the element and stops updating', () => {
  w = createNetworkWatcher()
  createBanner(w).destroy()
  setNetwork(false)
  expect(document.querySelector('.netwatch-banner')).toBeNull()
})

test('a hidden banner stays hidden even when an author rule sets display', () => {
  const style = document.createElement('style')
  style.textContent = '.netwatch-banner{display:flex}'
  document.head.append(style)
  try {
    w = createNetworkWatcher()
    banner = createBanner(w)
    expect(el().hidden).toBe(true)
    expect(getComputedStyle(el()).display).toBe('none')
  } finally {
    style.remove()
  }
})
