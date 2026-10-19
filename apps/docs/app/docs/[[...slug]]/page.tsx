import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { JsonLd } from '@/components/json-ld';
import { appName, getPageImageUrl, getPageMarkdownUrl, gitConfig, siteUrl } from '@/lib/shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  const url = `${siteUrl}${page.url}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'TechArticle',
              headline: page.data.title,
              description: page.data.description,
              url,
              image: `${siteUrl}${getPageImageUrl(page).url}`,
              inLanguage: 'en',
              author: { '@type': 'Person', name: gitConfig.user, url: `https://github.com/${gitConfig.user}` },
              publisher: { '@type': 'Organization', name: appName, url: siteUrl },
              isPartOf: { '@type': 'WebSite', name: appName, url: siteUrl },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: appName, item: siteUrl },
                { '@type': 'ListItem', position: 2, name: 'Docs', item: `${siteUrl}/docs` },
                ...(page.url === '/docs' ? [] : [{ '@type': 'ListItem', position: 3, name: page.data.title, item: url }]),
              ],
            },
          ],
        }}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${gitConfig.contentDir}/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      type: 'article',
      siteName: appName,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      images: getPageImageUrl(page).url,
    },
    twitter: { card: 'summary_large_image' },
  };
}
