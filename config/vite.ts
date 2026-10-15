const packages = (path: string) => new URL(`../packages/${path}`, import.meta.url).pathname

/** Resolve workspace packages to their source, so apps and tests never need a build. */
export const workspaceAlias = [
  { find: /^@net-watch\/core$/, replacement: packages('core/src/core/index.ts') },
  { find: /^@net-watch\/core\/(.+)$/, replacement: packages('core/src/$1/index.ts') },
  { find: /^@net-watch\/(react|vue|angular)$/, replacement: packages('$1/src/index.ts') },
]
