<div align="center">

# @net-watch/react

**React hook for real online/offline detection and connection quality.**

[![npm](https://img.shields.io/npm/v/@net-watch/react?color=0e9f6e&label=npm)](https://www.npmjs.com/package/@net-watch/react)
[![license](https://img.shields.io/npm/l/@net-watch/react?color=blue)](https://github.com/dangminhkhoi2212/net-watch/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/@net-watch/react)](https://www.npmjs.com/package/@net-watch/react)

[Documentation](https://net-watch-docs.vercel.app) · [Live demo](https://net-watch-docs.vercel.app) · [Source](https://github.com/dangminhkhoi2212/net-watch)

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/demo.gif" alt="net-watch live demo: latency and quality update, then the connection goes offline and recovers" width="640" />

</div>

Built on [`@net-watch/core`](https://www.npmjs.com/package/@net-watch/core): real online/offline detection and connection quality (latency, speed) as a hook.

## Install

```sh
pnpm add @net-watch/core @net-watch/react   # or npm i / yarn add
```

## Usage

```tsx
import { useNetworkStatus } from '@net-watch/react'

export function ConnectionBadge() {
  const { online, quality, rtt } = useNetworkStatus()

  if (!online) return <span>Offline</span>
  return <span>{quality}{rtt ? `, ${rtt} ms` : ''}</span>
}
```

## Good to know

- The default watcher has no `pingUrl`, so it detects unplugged cables and Wi-Fi off. Pass your own watcher to also detect "connected but no internet":

  ```ts
  import { createNetworkWatcher } from '@net-watch/core'

  export const watcher = createNetworkWatcher({ pingUrl: '/ping' })
  ```

- The state has `online`, `quality`, `rtt`, `downlink` and more. See the [state reference](https://net-watch-docs.vercel.app/docs/reference/state).

## Learn more

[React guide](https://net-watch-docs.vercel.app/docs/react) · [Core package](https://www.npmjs.com/package/@net-watch/core) · [Source](https://github.com/dangminhkhoi2212/net-watch)

## License

MIT
