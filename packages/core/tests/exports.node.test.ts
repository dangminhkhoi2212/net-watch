// Runs in Node against the built `dist/` (turbo builds before `pnpm test`): proves that both `import` and `require`
// resolve every published entry point, which the browser tests cannot see because they alias the packages to source.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packages = [
  { dir: '../../core/', name: '@net-watch/core', entries: [['', 'createNetworkWatcher'], ['/fetch', 'watchFetch'], ['/banner', 'createBanner']] },
  { dir: '../../react/', name: '@net-watch/react', entries: [['', 'useNetworkStatus']] },
  { dir: '../../vue/', name: '@net-watch/vue', entries: [['', 'useNetworkStatus']] },
] as const

/** Evaluate `code` in a fresh Node process inside the package, where its own name resolves through its `exports` map. */
const run = (cwd: string, args: string[]) => execFileSync(process.execPath, args, { cwd, encoding: 'utf8' }).trim()

describe.each(packages)('$name', ({ dir, name, entries }) => {
  const cwd = fileURLToPath(new URL(dir, import.meta.url))

  it.each(entries)('require(%j) and import() resolve', (entry, member) => {
    const id = name + entry
    // Node 22.12+ can require() ESM; the flag turns that off, as on older Node and in Jest's CommonJS mode.
    expect(run(cwd, ['--no-experimental-require-module', '-p', `typeof require('${id}').${member}`])).toBe('function')
    expect(run(cwd, ['--input-type=module', '-e', `console.log(typeof (await import('${id}')).${member})`])).toBe('function')
  })
})
