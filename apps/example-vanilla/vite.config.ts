import { defineConfig } from 'vite'
import { workspaceAlias } from '../../config/vite.ts'
import { demoRoutes } from '../demo-routes.ts'

export default defineConfig({
  plugins: [demoRoutes()],
  resolve: { alias: workspaceAlias },
})
