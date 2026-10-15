import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAlias } from '../../config/vite.ts'
import { browser } from '../../config/vitest.ts'

export default defineConfig({
  resolve: { alias: workspaceAlias },
  test: { browser: browser(playwright()) },
})
