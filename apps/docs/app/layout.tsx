import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { description, siteUrl, tagline } from '@/lib/shared';
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './global.css';

// Outfit carries the text and the headlines. It has no monospace cut, so IBM Plex Mono carries every measured number and code sample.
// The Latin files come from @fontsource, so the build never has to reach Google Fonts. global.css maps them to --font-*.

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'net-watch: know when your users are really offline',
    template: '%s | net-watch',
  },
  description,
  applicationName: 'net-watch',
  keywords: [
    'network status',
    'online offline detection',
    'navigator.onLine',
    'network quality',
    'connection speed',
    'latency',
    'offline banner',
    'react useNetworkStatus',
    'vue composable',
    'angular signal',
    'typescript',
  ],
  authors: [{ name: 'dangminhkhoi2212', url: 'https://github.com/dangminhkhoi2212' }],
  alternates: { canonical: './' },
  openGraph: { siteName: 'net-watch', type: 'website', locale: 'en_US', title: 'net-watch', description: tagline },
  twitter: { card: 'summary_large_image' },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
