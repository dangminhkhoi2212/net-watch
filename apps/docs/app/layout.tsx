import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google';
import { description, siteUrl, tagline } from '@/lib/shared';
import './global.css';

// Plex is an instrument-panel family: the condensed cut carries headlines, the mono cut carries every measured number.
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });
const condensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plex-condensed',
});
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

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
    <html
      lang="en"
      className={`${sans.variable} ${condensed.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
