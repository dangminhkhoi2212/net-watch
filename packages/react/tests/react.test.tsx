import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createNetworkWatcher, type NetworkWatcher } from '@net-watch/core'
import { useNetworkStatus } from '../src/index'
import { mockOnLine, setNetwork } from './helpers'

function Status({ watcher }: { watcher: NetworkWatcher }) {
  const { online } = useNetworkStatus(watcher)
  return <p>{online ? 'online' : 'offline'}</p>
}

let w: NetworkWatcher | undefined
afterEach(() => {
  w?.destroy()
  w = undefined
  vi.restoreAllMocks()
})

test('re-renders when the network status changes', async () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const screen = await render(<Status watcher={w} />)
  await expect.element(screen.getByText('online')).toBeInTheDocument()

  setNetwork(false)
  await expect.element(screen.getByText('offline')).toBeInTheDocument()

  setNetwork(true)
  await expect.element(screen.getByText('online')).toBeInTheDocument()
})

test('unsubscribes from the watcher on unmount', async () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const original = w.subscribe
  const unsubscribes: ReturnType<typeof vi.fn>[] = []
  vi.spyOn(w, 'subscribe').mockImplementation((listener) => {
    const off = vi.fn(original(listener))
    unsubscribes.push(off)
    return off
  })
  const screen = await render(<Status watcher={w} />)
  expect(unsubscribes.length).toBeGreaterThan(0)
  expect(unsubscribes.every((off) => off.mock.calls.length === 0)).toBe(true)

  await screen.unmount()
  expect(unsubscribes.at(-1)).toHaveBeenCalled()
  setNetwork(false) // must not throw or re-render an unmounted component
})
