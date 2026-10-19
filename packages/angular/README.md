<div align="center">

# @net-watch/angular

**Angular signal for real online/offline detection and connection quality.**

[![npm](https://img.shields.io/npm/v/@net-watch/angular?color=0e9f6e&label=npm)](https://www.npmjs.com/package/@net-watch/angular)
[![license](https://img.shields.io/npm/l/@net-watch/angular?color=blue)](https://github.com/dangminhkhoi2212/net-watch/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/@net-watch/angular)](https://www.npmjs.com/package/@net-watch/angular)

[Documentation](https://net-watch-docs.vercel.app) · [Live demo](https://net-watch-docs.vercel.app) · [Source](https://github.com/dangminhkhoi2212/net-watch)

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/demo.gif" alt="net-watch live demo: latency and quality update, then the connection goes offline and recovers" width="640" />

</div>

Built on [`@net-watch/core`](https://www.npmjs.com/package/@net-watch/core): real online/offline detection and connection quality (latency, speed) as a signal.

## Install

```sh
pnpm add @net-watch/core @net-watch/angular   # or npm i / yarn add
```

## Usage

```ts
import { Component } from '@angular/core'
import { injectNetworkStatus } from '@net-watch/angular'

@Component({
  selector: 'app-connection',
  template: `@if (!status().online) { Offline } @else { {{ status().quality }} }`,
})
export class ConnectionComponent {
  status = injectNetworkStatus()
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

[Angular guide](https://net-watch-docs.vercel.app/docs/frameworks/angular) · [Core package](https://www.npmjs.com/package/@net-watch/core) · [Source](https://github.com/dangminhkhoi2212/net-watch)

## License

MIT
