import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  tsconfig: 'tsconfig.build.json',
  // `legacy` also writes main/module/types, which TypeScript's node10 resolution (TS 5 and below) needs.
  exports: { legacy: true },
})
