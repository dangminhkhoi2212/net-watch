import { afterEach, expect, test, vi } from 'vitest'
import { createApp, createSSRApp, defineComponent, effectScope, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createNetworkWatcher, type NetworkWatcher } from '@net-watch/core'
import { useNetworkStatus } from '../src/index'
import { mockOnLine, setNetwork } from './helpers'

let w: NetworkWatcher | undefined
afterEach(() => {
  w?.destroy()
  w = undefined
  vi.restoreAllMocks()
})

test('tracks status and unsubscribes when the scope stops', () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const scope = effectScope()
  const status = scope.run(() => useNetworkStatus(w))!
  expect(status.value.online).toBe(true)

  setNetwork(false)
  expect(status.value.online).toBe(false)

  scope.stop()
  setNetwork(true)
  expect(status.value.online).toBe(false)
})

const statusComponent = (watcher: NetworkWatcher, onSetup?: (status: ReturnType<typeof useNetworkStatus>) => void) =>
  defineComponent({
    setup() {
      const status = useNetworkStatus(watcher)
      onSetup?.(status)
      return () => h('p', status.value.online ? 'online' : 'offline')
    },
  })

test('server rendering does not subscribe', async () => {
  // Vue never disposes a component scope while rendering on the server, so a subscription made there leaks on every render.
  mockOnLine(true)
  w = createNetworkWatcher()
  const subscribe = vi.spyOn(w, 'subscribe')

  const html = await renderToString(createSSRApp(statusComponent(w)))

  expect(html).toBe('<p>online</p>')
  expect(subscribe).not.toHaveBeenCalled()
})

test('in the browser a component subscribes once mounted, follows the network and unsubscribes on unmount', async () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const subscribe = vi.spyOn(w, 'subscribe')
  let captured: ReturnType<typeof useNetworkStatus> | undefined
  const host = document.createElement('div')
  const app = createApp(statusComponent(w, (status) => (captured = status)))

  expect(subscribe).not.toHaveBeenCalled()
  app.mount(host)
  expect(subscribe).toHaveBeenCalledOnce()

  setNetwork(false)
  await nextTick()
  expect(host.textContent).toBe('offline')

  app.unmount()
  setNetwork(true)
  expect(captured!.value.online).toBe(false)
})

test('a change between setup and mount is not missed', async () => {
  mockOnLine(true)
  w = createNetworkWatcher()
  const host = document.createElement('div')
  const app = createApp(
    statusComponent(w, () => {
      setNetwork(false) // happens after the first read in useNetworkStatus, before onMounted
    }),
  )
  app.mount(host)
  await nextTick()
  expect(host.textContent).toBe('offline')
  app.unmount()
})
