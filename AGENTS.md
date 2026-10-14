# net-watch

Network-status library: a zero-dependency TypeScript core (online/offline detection, connection metrics, banner) plus thin framework adapters, shipped as one package with subpath exports.

## Read first

- **Core change** (watcher, probe, metrics, fetch wrapper, banner, state shape, options, browser APIs) → [docs/architecture.md](docs/architecture.md). It is the contract; code follows it.
- **Adapter or integration** (React, Vue, Angular, any new framework, Capacitor, service worker, TanStack Query) → [docs/adapters.md](docs/adapters.md).

## Invariants

Every change keeps these. A change that needs to break one is a design change: update docs/architecture.md in the same change and call it out.

1. **Core is zero-dependency.** Core files import only each other and web platform APIs.
2. **Adapters are thin.** An adapter reads `getState()` + `subscribe()` (default `sharedWatcher()`) and nothing else. Behaviour an adapter wants lands in core first.
3. **Frameworks are optional peers.** React, Vue, Angular go in `peerDependencies` with `peerDependenciesMeta.<name>.optional: true`.
4. **Cross-browser floor: Chrome/Edge 90, Firefox 90, Safari/iOS 15.** Check each platform API against the support matrix in docs/architecture.md; Chromium-only APIs are hints with a fallback path.
5. **SSR-safe.** Importing any module and creating a watcher works without `window`.
6. **Immutable state.** A change replaces the state object; no change keeps the same reference.
7. **Online and idle sends zero requests** unless the app opts into `heartbeat`. Otherwise probes run only on suspicion or while offline.
8. **Unknown is `undefined`.** A metric the browser does not expose stays `undefined`; never estimate it from something unrelated.
9. **The public contract is semver.** Renaming or removing an export, state field or option is a major version.

## Definition of done

- A failing test exists in `tests/` before the implementation, and passes after.
- `pnpm vitest run` is green on chromium, firefox and webkit; `pnpm typecheck` and `pnpm build` are clean.
- Package `exports` comes from the tsdown build (`exports: true`); edit `tsdown.config.ts` entries, then rebuild.
- When behaviour or the public API changes, the docs and diagrams change with it. Diagram sources are `docs/diagrams/*.html`; re-export the `.svg` beside each with the diagram-design export script.
