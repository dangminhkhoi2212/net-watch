import { useEffect } from 'react'
import { createNetworkWatcher } from '@net-watch/core'
import { createBanner } from '@net-watch/core/banner'
import { watchFetch } from '@net-watch/core/fetch'
import { useNetworkStatus } from '@net-watch/react'

// Create the watcher once, outside components, and pass it to the hook.
const watcher = createNetworkWatcher({
  pingUrl: '/ping', // confirm real internet access, only when there is a reason to doubt it
  heartbeat: 30_000, // opt-in: also check every 30 s while the tab is visible
})
const api = watchFetch(watcher) // use instead of fetch: every real request becomes a free signal

const show = (value: unknown) => (value === undefined ? 'unknown' : String(value))

export function App() {
  const state = useNetworkStatus(watcher)

  // The banner is plain DOM, so it works the same in any framework.
  useEffect(() => createBanner(watcher, { slowText: 'Slow connection' }).destroy, [])

  return (
    <main>
      <h1>net-watch · React</h1>
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
        <dt>effectiveType</dt>
        <dd>{show(state.effectiveType)}</dd>
        <dt>type</dt>
        <dd>{show(state.type)}</dd>
        <dt>saveData</dt>
        <dd>{String(state.saveData)}</dd>
      </dl>
      <p>
        <button type="button" onClick={() => void api('/ping').catch(() => {})}>
          Send request
        </button>{' '}
        <button type="button" onClick={() => void api('/slow?ms=3000').catch(() => {})}>
          Send slow request (3 s)
        </button>
      </p>
      <ul>
        <li>Offline: DevTools → Network → Offline. The red banner appears; switch back for "Back online".</li>
        <li>Slow: click the slow request twice. <code>quality</code> turns <code>poor</code> and the yellow banner appears.</li>
        <li>Fields marked <code>unknown</code> are not exposed by this browser.</li>
      </ul>
    </main>
  )
}
