import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workspaceAlias } from '../../config/vite.ts'
import { demoRoutes } from '../demo-routes.ts'

export default defineConfig({
  plugins: [react(), demoRoutes()],
  resolve: { alias: workspaceAlias },
})
