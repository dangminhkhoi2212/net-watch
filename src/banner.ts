import type { NetworkListener, NetworkState, NetworkWatcher } from './watcher'

export interface BannerOptions {
  /** Default 'You are offline'. */
  offlineText?: string
  /** Default 'Back online'. */
  onlineText?: string
  /** Shown while quality is 'poor'. Unset = never show it. */
  slowText?: string
  /** Default 'bottom'. */
  position?: 'top' | 'bottom'
  /** ms the back-online message stays visible. Default 3000. */
  hideAfter?: number
  /** Default document.body. */
  container?: HTMLElement
}

type View = 'offline' | 'slow' | 'online'

// :where() keeps specificity at 0, so any user rule on .netwatch-banner wins.
const CSS = `
:where(.netwatch-banner){position:fixed;left:0;right:0;z-index:9999;padding:8px 16px;text-align:center;font:14px/1.4 system-ui,sans-serif;color:#fff}
:where(.netwatch-banner[data-position=top]){top:0}
:where(.netwatch-banner[data-position=bottom]){bottom:0}
:where(.netwatch-banner[data-state=offline]){background:#c62828}
:where(.netwatch-banner[data-state=slow]){background:#f9a825;color:#1a1a1a}
:where(.netwatch-banner[data-state=online]){background:#2e7d32}
`

export function createBanner(watcher: NetworkWatcher, options: BannerOptions = {}): { destroy: () => void } {
  const {
    offlineText = 'You are offline',
    onlineText = 'Back online',
    slowText,
    position = 'bottom',
    hideAfter = 3000,
    container = document.body,
  } = options
  const texts: Record<View, string> = { offline: offlineText, slow: slowText ?? '', online: onlineText }

  if (!document.getElementById('netwatch-style')) {
    const style = document.createElement('style')
    style.id = 'netwatch-style'
    style.textContent = CSS
    document.head.append(style)
  }

  const el = document.createElement('div')
  el.className = 'netwatch-banner'
  el.setAttribute('role', 'status')
  el.dataset['position'] = position
  el.hidden = true
  container.append(el)

  let timer: ReturnType<typeof setTimeout> | undefined
  const viewOf = (s: NetworkState): View =>
    !s.online ? 'offline' : slowText !== undefined && s.quality === 'poor' ? 'slow' : 'online'

  const show = (view: View) => {
    clearTimeout(timer)
    el.dataset['state'] = view
    el.textContent = texts[view]
    el.hidden = false
    if (view === 'online') timer = setTimeout(() => (el.hidden = true), hideAfter)
  }

  const render: NetworkListener = (state, prev) => {
    const view = viewOf(state)
    const before = viewOf(prev)
    if (view === before) return
    if (view === 'online' && before === 'slow') {
      clearTimeout(timer)
      el.hidden = true
      return
    }
    show(view)
  }

  const off = watcher.subscribe(render)
  const initial = viewOf(watcher.getState())
  if (initial !== 'online') show(initial)

  return {
    destroy() {
      off()
      clearTimeout(timer)
      el.remove()
    },
  }
}
