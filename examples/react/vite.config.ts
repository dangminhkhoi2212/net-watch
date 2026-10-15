import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { demoRoutes } from '../demo-routes.ts'

// A real app installs the package. Here `net-watch` resolves to the repo source, so the example runs without a build.
export default defineConfig({
  plugins: [react(), demoRoutes()],
  resolve: { alias: { 'net-watch': new URL('../../src', import.meta.url).pathname } },
})
