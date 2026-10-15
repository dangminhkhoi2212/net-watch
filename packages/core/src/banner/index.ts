import type { NetworkListener, NetworkState, NetworkWatcher } from '../core/index'

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

// Icons are CSS masks (stroke glyphs on a 24px grid), so they take the text colour and add no DOM nodes.
const icon = (paths: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${paths}%3C/svg%3E")`
const ICON_OFFLINE = icon("%3Cpath d='M3 9c5.2-4.6 12.8-4.6 18 0M6.5 12.8c3-2.6 8-2.6 11 0M12 18h.01M4 4l16 16'/%3E")
const ICON_SLOW = icon("%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7.5v5.5M12 16.5h.01'/%3E")
const ICON_ONLINE = icon("%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E")

// Every colour is a --netwatch-* variable, so apps theme the banner with one rule on .netwatch-banner (or a state selector).
// :where() keeps specificity at 0, so any user rule wins. The [hidden] rule is deliberately plain and !important:
// an author `display` rule would otherwise defeat the hidden attribute.
const CSS = `
.netwatch-banner[hidden]{display:none!important}
:where(.netwatch-banner){position:fixed;left:16px;right:16px;z-index:9999;box-sizing:border-box;max-width:28rem;margin-inline:auto;display:flex;align-items:center;gap:10px;padding:10px 14px;border-left:3px solid var(--netwatch-accent);border-radius:8px;background:var(--netwatch-bg);color:var(--netwatch-fg);box-shadow:0 4px 16px rgb(0 0 0/.08);font:500 14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;animation:netwatch-in .18s ease-out}
:where(.netwatch-banner)::before{content:"";flex:none;width:18px;height:18px;background:currentColor;-webkit-mask:var(--netwatch-icon) center/contain no-repeat;mask:var(--netwatch-icon) center/contain no-repeat}
:where(.netwatch-banner[data-position=top]){top:max(16px,env(safe-area-inset-top));--netwatch-shift:-6px}
:where(.netwatch-banner[data-position=bottom]){bottom:max(16px,env(safe-area-inset-bottom));--netwatch-shift:6px}
:where(.netwatch-banner[data-state=offline]){--netwatch-icon:${ICON_OFFLINE};--netwatch-bg:#fdeff3;--netwatch-fg:#b4234f;--netwatch-accent:#e0446d}
:where(.netwatch-banner[data-state=slow]){--netwatch-icon:${ICON_SLOW};--netwatch-bg:#fff7e6;--netwatch-fg:#8a5a00;--netwatch-accent:#f5b301}
:where(.netwatch-banner[data-state=online]){--netwatch-icon:${ICON_ONLINE};--netwatch-bg:#eefaf2;--netwatch-fg:#1a6b3c;--netwatch-accent:#2fb872}
@media (prefers-color-scheme:dark){
:where(.netwatch-banner){box-shadow:0 4px 16px rgb(0 0 0/.4)}
:where(.netwatch-banner[data-state=offline]){--netwatch-bg:#2b1a21;--netwatch-fg:#ff7a9c;--netwatch-accent:#ef476f}
:where(.netwatch-banner[data-state=slow]){--netwatch-bg:#2b2415;--netwatch-fg:#ffc83d;--netwatch-accent:#f5b301}
:where(.netwatch-banner[data-state=online]){--netwatch-bg:#15271c;--netwatch-fg:#4ade80;--netwatch-accent:#34c77b}
}
@keyframes netwatch-in{from{opacity:0;transform:translateY(var(--netwatch-shift,6px))}}
@media (prefers-reduced-motion:reduce){:where(.netwatch-banner){animation:none}}
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
