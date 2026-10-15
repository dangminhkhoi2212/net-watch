import { createNetworkWatcher, type NetworkState } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

const watcher = createNetworkWatcher({
  pingUrl: '/ping', // confirm real internet access, only when there is a reason to doubt it
  heartbeat: 30_000, // opt-in: also check every 30 s while the tab is visible
})
const api = watchFetch(watcher) // use instead of fetch: every real request becomes a free signal
createBanner(watcher, { slowText: 'Slow connection' })

const out = document.querySelector('#state')!
const render = (state: NetworkState) => {
  out.textContent = Object.entries({ ...state, since: new Date(state.since).toLocaleTimeString() })
    .map(([key, value]) => `${key.padEnd(14)}${value ?? 'unknown'}`)
    .join('\n')
}

watcher.subscribe(render)
render(watcher.getState())

const send = (path: string) => () => void api(path).catch(() => {})
document.querySelector('#fast')!.addEventListener('click', send('/ping'))
document.querySelector('#slow')!.addEventListener('click', send('/slow?ms=3000'))
