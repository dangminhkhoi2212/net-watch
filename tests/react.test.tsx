import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createNetworkWatcher, type NetworkWatcher } from '../src'
import { useNetworkStatus } from '../src/react'
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
