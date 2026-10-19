<div align="center">

# @net-watch/vue

**Vue 3 composable for real online/offline detection and connection quality.**

[![npm](https://img.shields.io/npm/v/@net-watch/vue?color=0e9f6e&label=npm)](https://www.npmjs.com/package/@net-watch/vue)
[![license](https://img.shields.io/npm/l/@net-watch/vue?color=blue)](https://github.com/dangminhkhoi2212/net-watch/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/@net-watch/vue)](https://www.npmjs.com/package/@net-watch/vue)

[Documentation](https://net-watch-docs.vercel.app) · [Live demo](https://net-watch-docs.vercel.app) · [Source](https://github.com/dangminhkhoi2212/net-watch)

<img src="https://raw.githubusercontent.com/dangminhkhoi2212/net-watch/main/docs/assets/demo.gif" alt="net-watch live demo: latency and quality update, then the connection goes offline and recovers" width="640" />

</div>

Built on [`@net-watch/core`](https://www.npmjs.com/package/@net-watch/core): real online/offline detection and connection quality (latency, speed) as a Vue 3 composable.

## Install

```sh
pnpm add @net-watch/core @net-watch/vue   # or npm i / yarn add
```

## Usage

```vue
<script setup lang="ts">
import { useNetworkStatus } from '@net-watch/vue'

const status = useNetworkStatus()
</script>

<template>
  <span v-if="!status.online">Offline</span>
  <span v-else>{{ status.quality }}<template v-if="status.rtt">, {{ status.rtt }} ms</template></span>
</template>
```

## Good to know

- The default watcher has no `pingUrl`, so it detects unplugged cables and Wi-Fi off. Pass your own watcher to also detect "connected but no internet":

  ```ts
  import { createNetworkWatcher } from '@net-watch/core'

  export const watcher = createNetworkWatcher({ pingUrl: '/ping' })
  ```

- The state has `online`, `quality`, `rtt`, `downlink` and more. See the [state reference](https://net-watch-docs.vercel.app/docs/reference/state).

## Learn more

[Vue guide](https://net-watch-docs.vercel.app/docs/frameworks/vue) · [Core package](https://www.npmjs.com/package/@net-watch/core) · [Source](https://github.com/dangminhkhoi2212/net-watch)

## License

MIT
