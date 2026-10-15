import type { Plugin } from 'vite'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Dev-server routes the examples talk to:
 * - `/ping` answers with 204: the recommended `pingUrl`.
 * - `/slow?ms=N` answers with 204 after N ms (default 1500, max 10000): a slow request to see `quality` drop.
 */
export const demoRoutes = (): Plugin => ({
  name: 'net-watch-demo-routes',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (url.pathname === '/ping') {
        res.writeHead(204, NO_STORE).end()
      } else if (url.pathname === '/slow') {
        const ms = Math.min(Number(url.searchParams.get('ms')) || 1500, 10_000)
        setTimeout(() => res.writeHead(204, NO_STORE).end(), ms)
      } else {
        next()
      }
    })
  },
})
