import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    ...source.getPages().map((page) => ({ url: `${siteUrl}${page.url}`, priority: page.url === '/docs' ? 0.9 : 0.7 })),
  ];
}
