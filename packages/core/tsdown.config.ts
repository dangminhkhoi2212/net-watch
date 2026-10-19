import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/core/index.ts', fetch: 'src/fetch/index.ts', banner: 'src/banner/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  exports: true,
})
