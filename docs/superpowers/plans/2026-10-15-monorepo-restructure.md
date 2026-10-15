# Monorepo restructure (dnd-kit layout) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single `net-watch` package into a monorepo that follows [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit): one package per layer under `packages/*`, runnable demos under `apps/*`, shared TypeScript config under `config/`, Turborepo for tasks, Changesets for versioning.

**Architecture:** `@net-watch/core` holds the framework-agnostic code, split by folder into `src/core` (watcher, probe, metrics), `src/fetch` and `src/banner`; the last two are subpath exports, the same way `@dnd-kit/abstract` ships `./modifiers`. `@net-watch/react`, `@net-watch/vue` and `@net-watch/angular` are separate packages that depend on `@net-watch/core` and nothing else. Apps, tests and type-checking resolve workspace packages to their **source** (Vite alias, tsconfig `paths`), so nothing needs a build first; only `pnpm build` produces `dist/`.

**Tech Stack:** pnpm workspaces + catalog, Turborepo, tsdown, TypeScript 7, Vitest browser mode (chromium, firefox, webkit), Changesets.

## Global Constraints

- This change **supersedes** the old rule "one package, move to a monorepo only when an adapter needs its own build tool". Update `AGENTS.md` and `docs/architecture.md` in the same change (Task 4).
- Behaviour does not change. The full test suite must keep passing: **219 tests across 27 test files at the start**; after the move the same tests run, split across packages (the count of tests per engine stays at 73).
- Package names (fixed): `@net-watch/core`, `@net-watch/react`, `@net-watch/vue`, `@net-watch/angular`; private apps `@net-watch/example-vanilla`, `@net-watch/example-react`.
- Public entry points (fixed): `@net-watch/core` → watcher API; `@net-watch/core/fetch` → `watchFetch`; `@net-watch/core/banner` → `createBanner`; `@net-watch/react` / `vue` / `angular` → one hook each. The old unscoped `net-watch` import no longer exists.
- Core stays zero-dependency. An adapter's only runtime dependency is `@net-watch/core` (`workspace:^`); its framework is a **required** peer (`react >=18`, `vue >=3.3`, `@angular/core >=17`), not optional, because the package is framework-specific.
- Versioning: Changesets with one `fixed` group of the four published packages (same version everywhere). Initial versions `0.0.0`.
- Tooling: pnpm (keep the current version, `pnpm -v`), tsdown (`platform: 'neutral'`, `target: 'es2020'`, `dts: true`, `exports: true`; never hand-edit `exports`), Vitest browser mode on three engines. Use `git mv` for moved files so history follows.
- Tests are not type-checked (as before); `pnpm typecheck` covers `src/` of packages and all of each app.
- Git identity is already configured locally. Commit messages end with a blank line and `Co-Authored-By: Claude <your model name> <noreply@anthropic.com>`.

## Target layout

```
net-watch/
├── package.json                 private root: scripts via turbo, changesets
├── pnpm-workspace.yaml          packages/*, apps/*, version catalog
├── turbo.json
├── LICENSE
├── AGENTS.md  CLAUDE.md  README.md
├── .changeset/                  config.json (fixed group), README.md, initial changeset
├── config/
│   ├── typescript/base.json     strictest + shared options + paths to workspace sources
│   ├── typescript/react.json    base + jsx
│   ├── vite.ts                  workspaceAlias (package names → source files)
│   └── vitest.ts                browser(provider): three-engine browser config
├── packages/
│   ├── core/    @net-watch/core
│   │   ├── src/core/{index,watcher,probe,metrics}.ts      → "."
│   │   ├── src/fetch/index.ts                              → "./fetch"
│   │   ├── src/banner/index.ts                             → "./banner"
│   │   ├── tests/{helpers,probe,metrics,watcher,watcher-probe,fetch,banner}...
│   │   └── package.json tsdown.config.ts vitest.config.ts tsconfig.json README.md LICENSE
│   ├── react/   @net-watch/react    src/index.ts  tests/
│   ├── vue/     @net-watch/vue      src/index.ts  tests/
│   └── angular/ @net-watch/angular  src/index.ts  tests/
├── apps/
│   ├── demo-routes.ts           shared dev-server routes (/ping, /slow)
│   ├── example-vanilla/
│   └── example-react/
└── docs/                        architecture.md adapters.md diagrams/ superpowers/
```

The old root `src/`, `tests/`, `examples/`, `playground/`, `tsconfig.json`, `tsdown.config.ts` and `vite.config.ts` are gone at the end. The playground is **deleted**: `apps/example-react` supersedes it.

---

### Task 1: Workspace skeleton + `@net-watch/core`

**Files:**
- Create: `pnpm-workspace.yaml`, `turbo.json`, `LICENSE`, `.changeset/config.json`, `.changeset/README.md`, `config/typescript/base.json`, `config/typescript/react.json`, `config/vite.ts`, `config/vitest.ts`, `packages/core/{package.json,tsdown.config.ts,vitest.config.ts,tsconfig.json,README.md,LICENSE}`
- Move (`git mv`): `src/{watcher,probe,metrics}.ts` → `packages/core/src/core/`; `src/index.ts` → `packages/core/src/core/index.ts`; `src/fetch.ts` → `packages/core/src/fetch/index.ts`; `src/banner.ts` → `packages/core/src/banner/index.ts`; `tests/{helpers,probe,metrics,watcher,watcher-probe,fetch,banner}.ts|test.ts` → `packages/core/tests/`
- Modify: root `package.json`, `.gitignore`
- Delete: root `tsconfig.json`, `tsdown.config.ts`, `vite.config.ts` (after the packages work)

**Interfaces:**
- Produces: package `@net-watch/core` with exports `.` (all current non-banner/non-fetch exports: `createNetworkWatcher`, `sharedWatcher`, and the types `ConnectionType, EffectiveType, NetworkListener, NetworkState, NetworkWatcher, Quality, RttBounds, WatcherOptions`), `./fetch` (`watchFetch`), `./banner` (`createBanner`, type `BannerOptions`).
- Produces: `config/vite.ts` exports `workspaceAlias` (an array for `resolve.alias`); `config/vitest.ts` exports `browser(provider)`; `config/typescript/{base,react}.json`. Later tasks reuse them.

- [ ] **Step 1: Root workspace files**

Record `pnpm -v` and the current root `package.json` devDependency ranges first (react, react-dom, vue, @angular/core, @angular/compiler, rxjs, @types/react, @types/react-dom, @vitejs/plugin-react, @vitest/browser-playwright, playwright, tsdown, typescript, vite, vitest, vitest-browser-react, @tsconfig/strictest); the catalog below reuses them.

`pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - apps/*

# One place for every shared version; packages reference them as `catalog:`.
catalog:
  '@angular/compiler': <current range>
  '@angular/core': <current range>
  '@tsconfig/strictest': <current range>
  '@types/react': <current range>
  '@types/react-dom': <current range>
  '@vitejs/plugin-react': <current range>
  '@vitest/browser-playwright': <current range>
  playwright: <current range>
  react: <current range>
  react-dom: <current range>
  rxjs: <current range>
  tsdown: <current range>
  typescript: <current range>
  vite: <current range>
  vitest: <current range>
  vitest-browser-react: <current range>
  vue: <current range>
```

(Replace each `<current range>` with the actual range from the current root `package.json`; no placeholders may remain.)

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": {},
    "test": { "cache": false },
    "dev": { "cache": false, "persistent": true },
    "clean": { "cache": false }
  }
}
```

Root `package.json` (replace entirely; use `npm view turbo version` / `npm view @changesets/cli version` for the two ranges, currently `^2.11.8` and `^3.0.3`):

```json
{
  "name": "net-watch-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@<output of pnpm -v>",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --concurrency 20",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "example:vanilla": "pnpm --filter @net-watch/example-vanilla dev",
    "example:react": "pnpm --filter @net-watch/example-react dev",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^3.0.3",
    "@tsconfig/strictest": "catalog:",
    "turbo": "^2.11.8",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

(`@tsconfig/strictest` and `typescript` are at the root because `config/typescript/*.json` extends them; `vite` is at the root because `apps/demo-routes.ts` imports its types.)

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@net-watch/core", "@net-watch/react", "@net-watch/vue", "@net-watch/angular"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@net-watch/example-vanilla", "@net-watch/example-react"]
}
```

`.changeset/README.md`:

```markdown
# Changesets

Run `pnpm changeset` in a PR that changes a published package, pick the bump, and describe the change. The four `@net-watch/*` packages are a fixed group: they always release with the same version.
```

`LICENSE`: standard MIT text, `Copyright (c) 2026 dangminhkhoi2212`.

`.gitignore`: append `.turbo`.

`config/typescript/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "extends": "@tsconfig/strictest/tsconfig.json",
  "compilerOptions": {
    "target": "esnext",
    "lib": ["es2023", "DOM"],
    "moduleDetection": "force",
    "module": "preserve",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "types": [],
    "declaration": true,
    "emitDeclarationOnly": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "paths": {
      "@net-watch/core": ["../../packages/core/src/core/index.ts"],
      "@net-watch/core/*": ["../../packages/core/src/*/index.ts"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

(`paths` are resolved relative to this file, so every package and app resolves the workspace packages to source.)

`config/typescript/react.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React",
  "extends": "./base.json",
  "compilerOptions": { "jsx": "react-jsx" }
}
```

`config/vite.ts`:

```ts
const packages = (path: string) => new URL(`../packages/${path}`, import.meta.url).pathname

/** Resolve workspace packages to their source, so apps and tests never need a build. */
export const workspaceAlias = [
  { find: /^@net-watch\/core$/, replacement: packages('core/src/core/index.ts') },
  { find: /^@net-watch\/core\/(.+)$/, replacement: packages('core/src/$1/index.ts') },
  { find: /^@net-watch\/(react|vue|angular)$/, replacement: packages('$1/src/index.ts') },
]
```

`config/vitest.ts`:

```ts
/** Browser mode on the three engines net-watch supports. `provider` is `playwright()` from the package's own `@vitest/browser-playwright`, so vitest and its provider resolve from one place. */
export const browser = (provider: unknown) => ({
  enabled: true,
  provider,
  instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
  headless: true,
})
```

(If strict typing rejects `provider: unknown` against Vitest's `BrowserConfigOptions`, type the parameter from `vitest/node` instead; the helper must not import `vitest` or the provider itself, so that every package resolves them from its own `node_modules`.)

- [ ] **Step 2: Move the core sources and tests**

```bash
mkdir -p packages/core/src/core packages/core/src/fetch packages/core/src/banner packages/core/tests
git mv src/watcher.ts src/probe.ts src/metrics.ts src/index.ts packages/core/src/core/
git mv src/fetch.ts packages/core/src/fetch/index.ts
git mv src/banner.ts packages/core/src/banner/index.ts
git mv tests/helpers.ts tests/probe.test.ts tests/metrics.test.ts tests/watcher.test.ts tests/watcher-probe.test.ts tests/fetch.test.ts tests/banner.test.ts packages/core/tests/
```

Edit imports (relative paths only, no behaviour change):

- `packages/core/src/core/index.ts`: remove the `watchFetch` and `createBanner` / `BannerOptions` re-exports. It keeps `export { createNetworkWatcher, sharedWatcher } from './watcher'` and the `export type { ... } from './watcher'` block.
- `packages/core/src/fetch/index.ts`: change `import type { NetworkWatcher } from './watcher'` to `import type { NetworkWatcher } from '../core/index'`.
- `packages/core/src/banner/index.ts`: change `from './watcher'` to `from '../core/index'`.
- Tests: `'../src'` → `'../src/core/index'` (watcher and watcher-probe tests); `import { watchFetch, type NetworkWatcher } from '../src'` → `import { watchFetch } from '../src/fetch/index'` plus `import type { NetworkWatcher } from '../src/core/index'`; banner test: `createBanner` from `'../src/banner/index'`, `createNetworkWatcher` / `NetworkWatcher` from `'../src/core/index'`; `'../src/probe'` → `'../src/core/probe'`; `'../src/metrics'` → `'../src/core/metrics'`. `./helpers` stays.

- [ ] **Step 3: Core package config**

`packages/core/package.json` (write the file; tsdown fills `exports` in Step 5):

```json
{
  "name": "@net-watch/core",
  "version": "0.0.0",
  "description": "Is the user really online, and how good is the connection? Zero-dependency network status for the web.",
  "type": "module",
  "sideEffects": false,
  "license": "MIT",
  "author": "dangminhkhoi2212",
  "homepage": "https://github.com/dangminhkhoi2212/net-watch#readme",
  "bugs": "https://github.com/dangminhkhoi2212/net-watch/issues",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dangminhkhoi2212/net-watch.git",
    "directory": "packages/core"
  },
  "files": ["dist", "LICENSE", "README.md"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo dist"
  },
  "devDependencies": {
    "@vitest/browser-playwright": "catalog:",
    "playwright": "catalog:",
    "tsdown": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

`packages/core/tsdown.config.ts`:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/core/index.ts', fetch: 'src/fetch/index.ts', banner: 'src/banner/index.ts' },
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  exports: true,
})
```

`packages/core/vitest.config.ts`:

```ts
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAlias } from '../../config/vite.ts'
import { browser } from '../../config/vitest.ts'

export default defineConfig({
  resolve: { alias: workspaceAlias },
  test: { browser: browser(playwright()) },
})
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../config/typescript/base.json",
  "include": ["src"]
}
```

`packages/core/README.md` (short, shown on npm):

```markdown
# @net-watch/core

Is the user really online, and how good is the connection? Zero-dependency network status for the web: layered online/offline detection, latency / throughput / quality, `watchFetch`, and an offline banner.

```bash
pnpm add @net-watch/core
```

```ts
import { createNetworkWatcher } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

const watcher = createNetworkWatcher({ pingUrl: '/ping' })
const api = watchFetch(watcher)
createBanner(watcher, { slowText: 'Slow connection' })
watcher.subscribe((state) => console.log(state.online, state.quality, state.rtt))
```

Framework adapters: `@net-watch/react`, `@net-watch/vue`, `@net-watch/angular`. Full documentation: https://github.com/dangminhkhoi2212/net-watch
```

Copy the root `LICENSE` to `packages/core/LICENSE`. Delete root `tsconfig.json`, `tsdown.config.ts`, `vite.config.ts` once Step 4 passes.

- [ ] **Step 4: Install and verify core**

```bash
pnpm install
pnpm --filter @net-watch/core typecheck
pnpm --filter @net-watch/core test
```

Expected: install succeeds; typecheck clean; the core tests pass on three engines. Core test count per engine = 73 − 4 adapter tests = 69, i.e. 207 test results (69 × 3). If any file imports something not yet moved (the adapter packages come later), report it.

- [ ] **Step 5: Build and inspect core**

```bash
pnpm --filter @net-watch/core build
npm pkg get exports --prefix packages/core
```

Expected: `exports` lists `"."`, `"./fetch"`, `"./banner"` (and `"./package.json"`); `packages/core/dist` contains `index.js`, `fetch.js`, `banner.js` and their `.d.ts`. `dist/fetch.js` and `dist/banner.js` contain no runtime import of the core module (types only).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: monorepo workspace and @net-watch/core package"
```

---

### Task 2: Adapter packages (`react`, `vue`, `angular`)

**Files:**
- Move: `src/react.ts` → `packages/react/src/index.ts`; `src/vue.ts` → `packages/vue/src/index.ts`; `src/angular.ts` → `packages/angular/src/index.ts`; `tests/react.test.tsx` → `packages/react/tests/`; `tests/vue.test.ts` → `packages/vue/tests/`; `tests/angular.test.ts` → `packages/angular/tests/`
- Create per package: `package.json`, `tsdown.config.ts`, `vitest.config.ts`, `tsconfig.json`, `README.md`, `LICENSE`, `tests/helpers.ts`

**Interfaces:**
- Consumes: `@net-watch/core` (`createNetworkWatcher`, `sharedWatcher`, types `NetworkState`, `NetworkWatcher`) and `config/*` from Task 1.
- Produces: `@net-watch/react` → `useNetworkStatus(watcher?)`; `@net-watch/vue` → `useNetworkStatus(watcher?)`; `@net-watch/angular` → `injectNetworkStatus(watcher?)` (signatures unchanged).

- [ ] **Step 1: Move and re-point imports**

```bash
mkdir -p packages/react/src packages/react/tests packages/vue/src packages/vue/tests packages/angular/src packages/angular/tests
git mv src/react.ts packages/react/src/index.ts
git mv src/vue.ts packages/vue/src/index.ts
git mv src/angular.ts packages/angular/src/index.ts
git mv tests/react.test.tsx packages/react/tests/
git mv tests/vue.test.ts packages/vue/tests/
git mv tests/angular.test.ts packages/angular/tests/
```

In each adapter source, `from './index'` becomes `from '@net-watch/core'`. In each adapter test: `from '../src'` (core API) becomes `from '@net-watch/core'`; `from '../src/react'` / `'../src/vue'` / `'../src/angular'` becomes `from '../src/index'`.

Each adapter only needs two test helpers, so each package gets its own small `tests/helpers.ts` (cross-package test imports would load a second copy of `vitest`):

```ts
import { vi } from 'vitest'

export function mockOnLine(online: boolean) {
  vi.spyOn(Navigator.prototype, 'onLine', 'get').mockReturnValue(online)
}

export function setNetwork(online: boolean) {
  mockOnLine(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}
```

- [ ] **Step 2: Package configs**

Per package, create the files below, substituting the framework. Common pieces for all three (`<fw>` = `react` | `vue` | `angular`, `<Fw>` = React | Vue | Angular):

`package.json` (shown for react; vue and angular differ only in name, description, `peerDependencies` and `devDependencies` as listed):

```json
{
  "name": "@net-watch/react",
  "version": "0.0.0",
  "description": "React hook for net-watch: useNetworkStatus()",
  "type": "module",
  "sideEffects": false,
  "license": "MIT",
  "author": "dangminhkhoi2212",
  "homepage": "https://github.com/dangminhkhoi2212/net-watch#readme",
  "bugs": "https://github.com/dangminhkhoi2212/net-watch/issues",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dangminhkhoi2212/net-watch.git",
    "directory": "packages/react"
  },
  "files": ["dist", "LICENSE", "README.md"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": { "@net-watch/core": "workspace:^" },
  "peerDependencies": { "react": ">=18" },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "@vitest/browser-playwright": "catalog:",
    "playwright": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tsdown": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "vitest-browser-react": "catalog:"
  }
}
```

- vue: name `@net-watch/vue`, description "Vue composable for net-watch: useNetworkStatus()", `directory` `packages/vue`, `peerDependencies: { "vue": ">=3.3" }`, devDependencies = `@vitest/browser-playwright`, `playwright`, `tsdown`, `typescript`, `vitest`, `vue` (all `catalog:`).
- angular: name `@net-watch/angular`, description "Angular signal for net-watch: injectNetworkStatus()", `directory` `packages/angular`, `peerDependencies: { "@angular/core": ">=17" }`, devDependencies = `@angular/compiler`, `@angular/core`, `@vitest/browser-playwright`, `playwright`, `rxjs`, `tsdown`, `typescript`, `vitest` (all `catalog:`).

`tsdown.config.ts` (identical for all three):

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  exports: true,
})
```

`tsconfig.json`: vue and angular use `{ "extends": "../../config/typescript/base.json", "include": ["src"] }`; react uses `{ "extends": "../../config/typescript/react.json", "include": ["src"] }`.

`vitest.config.ts`: same as core's (Task 1); the react package also adds the React plugin:

```ts
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAlias } from '../../config/vite.ts'
import { browser } from '../../config/vitest.ts'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: workspaceAlias },
  test: { browser: browser(playwright()) },
})
```

`README.md` per package: title `# @net-watch/<fw>`, one-sentence description, install line `pnpm add @net-watch/core @net-watch/<fw>`, a 3-line usage snippet (React: `const { online, quality, rtt } = useNetworkStatus()`; Vue: `const status = useNetworkStatus() // status.value.online`; Angular: `status = injectNetworkStatus() // status().online`), and a link to the repository docs. Copy `LICENSE` from the root.

- [ ] **Step 3: Install and verify each adapter**

```bash
pnpm install
pnpm --filter @net-watch/react --filter @net-watch/vue --filter @net-watch/angular typecheck
pnpm --filter @net-watch/react --filter @net-watch/vue --filter @net-watch/angular test
```

Expected: install succeeds; typecheck clean; react 2 tests × 3 engines, vue 1 × 3, angular 1 × 3 all pass (12 results).

- [ ] **Step 4: Build and inspect**

```bash
pnpm build
for p in core react vue angular; do npm pkg get exports --prefix packages/$p; done
grep -h 'from "@net-watch/core"' packages/react/dist/index.js packages/vue/dist/index.js packages/angular/dist/index.js
```

Expected: `pnpm build` (turbo) builds core first, then the adapters; each adapter's `dist/index.js` imports `@net-watch/core` (external, not bundled) and its framework; each `exports` lists `"."` and `"./package.json"`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: @net-watch/react, @net-watch/vue and @net-watch/angular packages"
```

---

### Task 3: Apps (examples), remove leftovers

**Files:**
- Move: `examples/demo-routes.ts` → `apps/demo-routes.ts`; `examples/vanilla/*` → `apps/example-vanilla/`; `examples/react/*` → `apps/example-react/`
- Create: `apps/example-vanilla/{package.json,tsconfig.json}`, `apps/example-react/{package.json,tsconfig.json}`
- Modify: the moved `vite.config.ts` files and sources (imports)
- Delete: `playground/` (superseded by `apps/example-react`), root `src/`, `tests/`, `examples/` leftovers if empty

**Interfaces:**
- Consumes: `workspaceAlias` from `config/vite.ts`; `@net-watch/core`, `@net-watch/core/fetch`, `@net-watch/core/banner`, `@net-watch/react`.

- [ ] **Step 1: Move**

```bash
mkdir -p apps
git mv examples/demo-routes.ts apps/demo-routes.ts
git mv examples/vanilla apps/example-vanilla
git mv examples/react apps/example-react
git rm -r -q playground
```

- [ ] **Step 2: App configs and imports**

`apps/example-vanilla/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { workspaceAlias } from '../../config/vite.ts'
import { demoRoutes } from '../demo-routes.ts'

export default defineConfig({
  plugins: [demoRoutes()],
  resolve: { alias: workspaceAlias },
})
```

`apps/example-react/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workspaceAlias } from '../../config/vite.ts'
import { demoRoutes } from '../demo-routes.ts'

export default defineConfig({
  plugins: [react(), demoRoutes()],
  resolve: { alias: workspaceAlias },
})
```

Import updates:
- `apps/example-vanilla/main.ts`: `import { createBanner, createNetworkWatcher, watchFetch, type NetworkState } from 'net-watch'` becomes `import { createNetworkWatcher, type NetworkState } from '@net-watch/core'`, `import { watchFetch } from '@net-watch/core/fetch'`, `import { createBanner } from '@net-watch/core/banner'`.
- `apps/example-react/App.tsx`: `from 'net-watch'` becomes the same three core imports as above (without `NetworkState`); `from 'net-watch/react'` becomes `from '@net-watch/react'`.

`apps/example-vanilla/package.json`:

```json
{
  "name": "@net-watch/example-vanilla",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": { "@net-watch/core": "workspace:*" },
  "devDependencies": { "typescript": "catalog:", "vite": "catalog:" }
}
```

`apps/example-react/package.json`:

```json
{
  "name": "@net-watch/example-react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": {
    "@net-watch/core": "workspace:*",
    "@net-watch/react": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

`apps/example-vanilla/tsconfig.json`: `{ "extends": "../../config/typescript/base.json", "include": ["."] }`. `apps/example-react/tsconfig.json`: `{ "extends": "../../config/typescript/react.json", "include": ["."] }`.

- [ ] **Step 3: Verify**

```bash
pnpm install
pnpm typecheck
pnpm --filter @net-watch/example-vanilla build
pnpm --filter @net-watch/example-react build
```

Expected: `pnpm typecheck` (turbo) is clean for all packages and apps; both app builds succeed. Then start each dev server once (`pnpm example:vanilla -- --port 5601 --strictPort`, `pnpm example:react -- --port 5602 --strictPort`), confirm `HEAD /ping` returns 204 and `GET /` returns 200 on each, with no Vite warnings, and stop only the servers you started (never `pkill -f vite` broadly; kill by PID). Remove any `dist/` the app builds created if it shows up in `git status` (it is gitignored).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move examples to apps/, drop playground"
```

---

### Task 4: Docs, README, changeset, diagrams

**Files:**
- Modify: `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/adapters.md`, `docs/diagrams/architecture.html` (+ re-exported `architecture.svg`)
- Create: `.changeset/initial-release.md`

**Interfaces:** none (documentation only). Every example import in the docs must match the real entry points listed in Global Constraints.

- [ ] **Step 1: `AGENTS.md`**

- Intro: "shipped as a pnpm monorepo of four published packages (`@net-watch/core`, `/react`, `/vue`, `/angular`) following the dnd-kit layout".
- "Read first" paths stay; add one line: layout and conventions → `docs/architecture.md#repository-layout`.
- Invariant 3 becomes: "**Framework packages are separate.** Each adapter is its own package with a required peer on its framework and `@net-watch/core` as its only dependency; core never imports a framework."
- Invariant 2 keeps "reads `getState()` + `subscribe()` (default `sharedWatcher()`)".
- Definition of done: replace the line about hand-editing `exports` with "Each package's `exports` comes from its tsdown build; edit `tsdown.config.ts` entries, then rebuild"; replace the examples line with "`pnpm typecheck` covers packages and apps; `pnpm example:vanilla` / `pnpm example:react` run the apps"; add "A change to a published package needs a changeset (`pnpm changeset`)".
- Add a short **Commands** block: `pnpm build`, `pnpm test`, `pnpm typecheck` (all via Turborepo), `pnpm --filter <name> <script>` for one package.

- [ ] **Step 2: `docs/architecture.md`**

Replace the "Package shape" section with a **Repository layout** section (anchor `#repository-layout`) containing the target-layout tree from this plan (packages, apps, config), a table of published packages and entry points (Global Constraints), and these rules: the workspace is Turborepo + pnpm; apps, tests and type-checking resolve packages to **source** through `config/vite.ts` aliases and `config/typescript/base.json` `paths`; only `pnpm build` creates `dist/`; the four packages release together through one Changesets `fixed` group. Update the "Core modules" table to the new paths (`packages/core/src/core/watcher.ts`, `probe.ts`, `metrics.ts`, `index.ts`; `packages/core/src/fetch/index.ts`; `packages/core/src/banner/index.ts`) and fix the sentence about `fetch.ts` and `banner.ts` using only the public API accordingly. In the public contract block, replace `watchFetch` / `createBanner` import lines' comments to show their subpaths (`@net-watch/core/fetch`, `@net-watch/core/banner`). Remove "Move to a pnpm-workspace monorepo only when…".

- [ ] **Step 3: `docs/adapters.md`**

Every adapter lives at `packages/<framework>/src/index.ts` and is published as `@net-watch/<framework>`; imports are `from '@net-watch/core'`; the three reference implementations use that import. Update the contract list item 1 ("Lives in a package of its own: `packages/<framework>`, name `@net-watch/<framework>`") and the "Adding a new adapter" checklist: create the package (copy `packages/react` as the template: `package.json`, `tsdown.config.ts`, `vitest.config.ts`, `tsconfig.json`, README, LICENSE, `tests/helpers.ts`), add the package name to the `fixed` group in `.changeset/config.json`, add its alias to `config/vite.ts` `workspaceAlias`, add a `catalog:` entry for the framework in `pnpm-workspace.yaml`, framework is a required peer. In "Integrations via `report()`", keep recipes; add `import` lines from `@net-watch/core` where the recipes mention `watcher`.

- [ ] **Step 4: `README.md` (root)**

Rewrite the install and usage sections for the scoped packages:

```bash
pnpm add @net-watch/core            # core
pnpm add @net-watch/core @net-watch/react   # React (same for vue / angular)
```

Core example imports: `createNetworkWatcher` from `@net-watch/core`, `watchFetch` from `@net-watch/core/fetch`, `createBanner` from `@net-watch/core/banner`. React/Vue/Angular sections import from `@net-watch/react` / `@net-watch/vue` / `@net-watch/angular`. Add a **Packages** table (name, purpose). Update the Examples section (`pnpm example:vanilla`, `pnpm example:react`, apps live in `apps/`). Update Development: `pnpm install`, `pnpm exec playwright install chromium firefox webkit`, `pnpm test`, `pnpm build`, `pnpm typecheck`, `pnpm changeset`, `pnpm release`; remove `pnpm play` and `bumpp`.

- [ ] **Step 5: Changeset**

`.changeset/initial-release.md`:

```markdown
---
'@net-watch/core': minor
'@net-watch/react': minor
'@net-watch/vue': minor
'@net-watch/angular': minor
---

Initial release: layered online/offline detection, connection quality (rtt, downlink, quality bands), `watchFetch`, an offline banner, and React, Vue and Angular adapters.
```

Run `pnpm exec changeset status` and confirm it reports all four packages with a minor bump and no errors.

- [ ] **Step 6: Diagram**

In `docs/diagrams/architecture.html`, update the file-path sublabels to the new layout (e.g. `core/watcher.ts`, `core/probe.ts`, `core/metrics.ts`, `core/fetch`, `core/banner`) and the desc text if it names `src/…`; keep geometry unchanged (labels must still fit their boxes: shorter labels only). Re-export and check:

```bash
python3 /Users/dangminhkhoi/.claude/plugins/cache/diagram-design/diagram-design/2.6.68/skills/diagram-design/scripts/self_check.py docs/diagrams/architecture.html
python3 /Users/dangminhkhoi/.claude/plugins/cache/diagram-design/diagram-design/2.6.68/skills/diagram-design/scripts/export_svg.py docs/diagrams/architecture.html
```

Also search `docs/diagrams/state-machine.html` for `src/` paths and fix the same way if present.

- [ ] **Step 7: Final verification and commit**

```bash
grep -rn "from 'net-watch\|net-watch/react\|net-watch/vue\|net-watch/angular\|pnpm play\|bumpp\|src/watcher.ts\|src/fetch.ts\|src/banner.ts" README.md AGENTS.md docs/*.md docs/diagrams/*.html apps packages --include='*' 2>/dev/null | grep -v node_modules | grep -v '@net-watch/'
pnpm build && pnpm typecheck && pnpm test
for p in core react vue angular; do (cd packages/$p && npm pack --dry-run 2>&1 | grep -E 'dist/|README|LICENSE|package.json' | head -20); done
```

Expected: the grep prints nothing (no stale references; matches inside `@net-watch/…` are filtered out); build, typecheck and test are green, and the test results total 219 (73 per engine × 3); each tarball contains only `dist/*`, `README.md`, `LICENSE`, `package.json`.

```bash
git add -A
git commit -m "docs: monorepo layout, scoped package names, changeset"
```
