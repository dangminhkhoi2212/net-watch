import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.ts', 'src/vue.ts'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  exports: true,
})
