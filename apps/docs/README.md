# net-watch documentation site

The documentation site for net-watch: a landing page with a live demo, guides, an API reference and prompts for AI assistants. It is a private workspace package (`@net-watch/docs`) built with [Fumadocs](https://fumadocs.dev) on Next.js.

## Run it

From the repository root:

```bash
pnpm docs   # builds the packages, then starts the site on http://localhost:3000
```

The site imports `@net-watch/core` and `@net-watch/react` like a user would, so the packages are built first (`turbo run build --filter=@net-watch/docs^...`). After a change in `packages/*`, restart `pnpm docs` to rebuild them.

Other commands (run with `pnpm --filter @net-watch/docs <script>`):

| Script | Does |
|---|---|
| `build` | production build (needs the packages built: use `pnpm turbo run build --filter=@net-watch/docs` from the root) |
| `start` | serve the production build |
| `typecheck` | `next typegen && tsc --noEmit` |

## What is where

```
app/(home)/page.tsx      landing page
components/home/         live demo (telemetry.tsx), page accent and banner (live-accent.tsx)
lib/demo.ts              the demo's watcher, sample stores and request helpers
app/api/ping|slow|payload  endpoints the live demo talks to (ping is also a working `pingUrl` example)
app/docs/                docs layout and page renderer
content/docs/            the documentation, as MDX
public/diagrams/         SVG diagrams (copies of docs/diagrams/*.svg)
lib/shared.ts            site name, GitHub and npm links, site URL
```

Built in by Fumadocs: search (`/api/search`, Orama, runs on the server), `/llms.txt`, `/llms-full.txt`, every docs page as Markdown (`/docs/<page>.md`), Open Graph images (`/og/docs/...`), and "Copy Markdown" and "Open" buttons on each page.

## Write a page

1. Add `content/docs/<section>/<name>.mdx` with `title` and `description` frontmatter.
2. Add the page name to that section's `meta.json` to place it in the sidebar.
3. MDX components available without an import: `Tabs`/`Tab`, `Steps`/`Step`, `Callout`, `Cards`/`Card`, `Accordions`, `TypeTable`, `Diagram`, and `Prompt` (a copyable prompt for AI assistants). Install commands use a ```` ```package-install ```` block, which renders npm, pnpm, yarn and bun tabs.

When behaviour or the public API of a package changes, update the matching pages here and `docs/architecture.md` (the contract) in the same change.

## Configuration

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | absolute URL of the deployed site, used for Open Graph images and canonical URLs. On Vercel `VERCEL_PROJECT_PRODUCTION_URL` is used when it is not set. |

## Deploy

Deploy it as its own project (it is not published to npm). On Vercel:

- Root Directory: `apps/docs`, with "Include source files outside of the Root Directory" turned on.
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm turbo run build --filter=@net-watch/docs`

The build needs network access once, to fetch the Google fonts. The API routes (`/api/ping`, `/api/slow`, `/api/payload`, `/api/search`) need a server runtime, so a fully static export is not possible. These Vercel settings have not been tested yet.
