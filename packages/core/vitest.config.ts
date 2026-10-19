import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAlias } from '../../config/vite.ts'
import { browser } from '../../config/vitest.ts'

export default defineConfig({
  resolve: { alias: workspaceAlias },
  test: {
    projects: [
      { extends: true, test: { name: 'browser', exclude: ['tests/**/*.node.test.ts'], browser: browser(playwright()) } },
      // Node-only checks of the built packages, see tests/exports.node.test.ts.
      { test: { name: 'node', include: ['tests/**/*.node.test.ts'], environment: 'node' } },
    ],
  },
})
