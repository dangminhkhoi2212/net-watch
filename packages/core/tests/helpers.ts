import { vi } from 'vitest'

/** Fake navigator.onLine without firing events. */
export function mockOnLine(online: boolean) {
  vi.spyOn(Navigator.prototype, 'onLine', 'get').mockReturnValue(online)
}

/** Fake navigator.onLine and fire the matching window event, like the browser does. */
export function setNetwork(online: boolean) {
  mockOnLine(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

/** Shadow navigator.connection (Chromium-only) with `value`; returns a restore function. */
export function mockConnection(value: EventTarget | undefined): () => void {
  Object.defineProperty(navigator, 'connection', { value, configurable: true })
  return () => {
    delete (navigator as unknown as Record<string, unknown>)['connection']
  }
}

export const fakeConnection = (props: {
  rtt?: number
  downlink?: number
  effectiveType?: string
  type?: string
  saveData?: boolean
}) => Object.assign(new EventTarget(), props)

type TimingEntry = { transferSize: number; responseStart: number; responseEnd: number }

/** Replace PerformanceObserver (undo with vi.unstubAllGlobals); `emit` feeds entries to every observer created. */
export function fakePerformanceObserver() {
  const callbacks: PerformanceObserverCallback[] = []
  const observeSpy = vi.fn()
  const disconnectSpy = vi.fn()
  vi.stubGlobal(
    'PerformanceObserver',
    class {
      constructor(callback: PerformanceObserverCallback) {
        callbacks.push(callback)
      }
      observe = observeSpy
      disconnect = disconnectSpy
    },
  )
  return {
    observe: observeSpy,
    disconnect: disconnectSpy,
    emit(entries: TimingEntry[]) {
      const list = { getEntries: () => entries } as unknown as PerformanceObserverEntryList
      for (const callback of callbacks) callback(list, {} as PerformanceObserver)
    },
  }
}
