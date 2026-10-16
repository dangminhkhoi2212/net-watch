import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'net-watch';
export const tagline = 'Know when your users are really offline, and how good their connection is.';
export const description =
  'net-watch tells your app whether the user can really reach the internet and how fast the connection is. Zero-dependency core with React, Vue and Angular adapters.';
export const npmUrl = 'https://www.npmjs.com/package/@net-watch/core';
/** Absolute origin of the deployed site (OG images, canonical URLs). Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'dangminhkhoi2212',
  repo: 'net-watch',
  branch: 'main',
  /** Where the docs content lives inside the repository. */
  contentDir: 'apps/docs/content/docs',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
