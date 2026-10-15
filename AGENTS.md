# net-watch

Network-status library: a zero-dependency TypeScript core (online/offline detection, connection metrics, banner) plus thin framework adapters, shipped as a pnpm monorepo of four published packages (`@net-watch/core`, `/react`, `/vue`, `/angular`) following the dnd-kit layout.

## Read first

- **Core change** (watcher, probe, metrics, fetch wrapper, banner, state shape, options, browser APIs) → [docs/architecture.md](docs/architecture.md). It is the contract; code follows it.
- **Adapter or integration** (React, Vue, Angular, any new framework, Capacitor, service worker, TanStack Query) → [docs/adapters.md](docs/adapters.md).
- **Layout, build and conventions** → [docs/architecture.md#repository-layout](docs/architecture.md#repository-layout).
- **Branches, versions, publishing to npm (gitflow, beta pre mode, CI/CD)** → [docs/releasing.md](docs/releasing.md).

## Invariants

Every change keeps these. A change that needs to break one is a design change: update docs/architecture.md in the same change and call it out.

1. **Core is zero-dependency.** Core files import only each other and web platform APIs.
2. **Adapters are thin.** An adapter reads `getState()` + `subscribe()` (default `sharedWatcher()`) and nothing else. Behaviour an adapter wants lands in core first.
3. **Framework packages are separate.** Each adapter is its own package with a required peer on its framework and `@net-watch/core` as its only dependency; core never imports a framework.
4. **Cross-browser floor: Chrome/Edge 90, Firefox 90, Safari/iOS 15.** Check each platform API against the support matrix in docs/architecture.md; Chromium-only APIs are hints with a fallback path.
5. **SSR-safe.** Importing any module and creating a watcher works without `window`.
6. **Immutable state.** A change replaces the state object; no change keeps the same reference.
7. **Online and idle sends zero requests** unless the app opts into `heartbeat`. Otherwise probes run only on suspicion or while offline.
8. **Unknown is `undefined`.** A metric the browser does not expose stays `undefined`; never estimate it from something unrelated.
9. **The public contract is semver.** Renaming or removing an export, state field or option is a major version.

## Definition of done

- A failing test exists in `packages/<package>/tests/` before the implementation, and passes after.
- `pnpm test` is green on chromium, firefox and webkit; `pnpm typecheck` and `pnpm build` are clean.
- Each package's `exports` comes from its tsdown build; edit `tsdown.config.ts` entries, then rebuild.
- `pnpm typecheck` covers packages and apps; `pnpm example:vanilla` / `pnpm example:react` run the apps.
- A change to a published package needs a changeset (`pnpm changeset`).
- When behaviour or the public API changes, the docs and diagrams change with it. Diagram sources are `docs/diagrams/*.html`; re-export the `.svg` beside each with the diagram-design export script.

## Commands

- `pnpm build`, `pnpm test`, `pnpm typecheck`: all packages, via Turborepo.
- `pnpm --filter <name> <script>`: one package, e.g. `pnpm --filter @net-watch/core test`.
