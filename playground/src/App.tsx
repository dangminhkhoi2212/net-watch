import { useEffect } from 'react'
import { createBanner, createNetworkWatcher, watchFetch } from '../../src'
import { useNetworkStatus } from '../../src/react'

// The Vite dev server answers HEAD / on the same origin, which makes it a valid pingUrl here.
const watcher = createNetworkWatcher({ pingUrl: '/', heartbeat: 30_000 })
const trackedFetch = watchFetch(watcher)
const show = (value: unknown) => (value === undefined ? 'unknown' : String(value))

export function App() {
  const state = useNetworkStatus(watcher)
  useEffect(() => createBanner(watcher, { slowText: 'Slow connection' }).destroy, [])
  return (
    <main>
      <dl>
        <dt>online</dt>
        <dd>
          {String(state.online)} since {new Date(state.since).toLocaleTimeString()}
        </dd>
        <dt>quality</dt>
        <dd>{state.quality}</dd>
        <dt>rtt</dt>
        <dd>{show(state.rtt)} ms</dd>
        <dt>downlink</dt>
        <dd>{show(state.downlink)} Mbps</dd>
        <dt>effectiveType / type</dt>
        <dd>
          {show(state.effectiveType)} / {show(state.type)}
        </dd>
        <dt>saveData</dt>
        <dd>{String(state.saveData)}</dd>
      </dl>
      <button type="button" onClick={() => void trackedFetch('/').catch(() => {})}>
        Send a tracked request
      </button>
    </main>
  )
}
