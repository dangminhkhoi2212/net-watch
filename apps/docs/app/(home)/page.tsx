import Link from 'next/link';
import type { Metadata } from 'next';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { CopyCommand } from '@/components/home/copy-button';
import { Diagram } from '@/components/diagram';
import { LiveAccent } from '@/components/home/live-accent';
import { Telemetry } from '@/components/home/telemetry';
import { Prompt } from '@/components/prompt';
import { JsonLd } from '@/components/json-ld';
import { appName, description, gitConfig, npmUrl, siteUrl, tagline } from '@/lib/shared';

export const metadata: Metadata = {
  title: { absolute: 'net-watch: know when your users are really offline' },
  description,
  alternates: { canonical: '/' },
  // A page-level openGraph replaces the layout's, which drops the app/opengraph-image file, so the image is named here.
  openGraph: { title: 'net-watch', description: tagline, url: '/', images: '/opengraph-image' },
};

const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const sectionClass = 'border-t py-16 md:py-24';
const h2Class = 'font-display text-3xl font-semibold tracking-tight sm:text-4xl';
const proseClass = 'max-w-[62ch] space-y-4 text-lg leading-relaxed text-fd-muted-foreground';

type Tone = 'good' | 'slow' | 'bad' | 'idle';

const situations: { title: string; detail: string; browser: string; netWatch: string; tone: Tone }[] = [
  { title: 'Router has no internet', detail: 'Wi-Fi is connected, nothing is behind it', browser: 'online', netWatch: 'offline', tone: 'bad' },
  { title: 'Captive portal', detail: 'Hotel or airport Wi-Fi waiting for a sign-in page', browser: 'online', netWatch: 'offline', tone: 'bad' },
  { title: 'Virtual adapter', detail: 'A VPN or Docker adapter is up, Wi-Fi is off', browser: 'online', netWatch: 'offline', tone: 'bad' },
  { title: 'Your server is down', detail: 'Or blocked by a firewall', browser: 'online', netWatch: 'offline', tone: 'bad' },
  { title: 'In a tunnel', detail: 'Connected, but every request takes seconds', browser: 'online', netWatch: 'online, poor', tone: 'slow' },
  { title: 'Airplane mode', detail: 'The one case the browser gets right', browser: 'offline', netWatch: 'offline', tone: 'idle' },
];

const evidence: { title: string; cost: string; tone: Tone; body: React.ReactNode }[] = [
  {
    title: "The browser's own signals",
    cost: '0 requests',
    tone: 'good',
    body: 'The online and offline events, the tab becoming visible, a page restored from the back and forward cache. Offline is trusted at once.',
  },
  {
    title: 'Your own requests',
    cost: '0 extra requests',
    tone: 'good',
    body: (
      <>
        Wrap <code className="font-mono text-sm">fetch</code> once. A response proves the network works and becomes a latency sample. A network error raises a suspicion.
      </>
    ),
  },
  {
    title: 'A probe, when needed',
    cost: '1 HEAD request',
    tone: 'slow',
    body: 'A tiny request to your ping endpoint settles a suspicion. While offline it retries after 2 seconds, then 4, 8 and so on up to 30, and stops when the connection is back.',
  },
];

const qualityBands: { name: string; range: string; tone: Tone }[] = [
  { name: 'excellent', range: 'under 150 ms', tone: 'good' },
  { name: 'good', range: '150 to 400 ms', tone: 'good' },
  { name: 'fair', range: '400 to 1400 ms', tone: 'slow' },
  { name: 'poor', range: '1400 ms and up', tone: 'bad' },
];

const measures: { title: string; field: string; body: string }[] = [
  { title: 'Latency', field: 'rtt', body: 'Every probe and every request you send gives a time to first byte. net-watch smooths the samples and rounds them to 50 ms.' },
  {
    title: 'Download speed',
    field: 'downlink',
    body: 'Read from the resource timing of large responses (50 kB or more) you already loaded. No test files, no extra data for your users. Cross-origin files need Timing-Allow-Origin.',
  },
  { title: 'Not available', field: 'undefined', body: 'A value the browser does not expose stays undefined, never a guess. No web page can read Wi-Fi signal strength.' },
];

/** A chip tinted with one of the four connection colours from global.css. */
const tint = (tone: Tone) => ({
  color: `var(--nw-${tone})`,
  borderColor: `color-mix(in oklab, var(--nw-${tone}) 45%, transparent)`,
  backgroundColor: `color-mix(in oklab, var(--nw-${tone}) 10%, transparent)`,
});

const stateFields = [
  { field: 'online, since', where: 'Every browser' },
  { field: 'rtt, quality', where: 'Every browser, once one request or probe has finished' },
  { field: 'downlink', where: 'Chrome, Edge, Firefox, Safari 16.4 and later' },
  { field: 'effectiveType, saveData', where: 'Chrome and Edge' },
  { field: 'type (wifi, cellular)', where: 'Chrome on Android and ChromeOS' },
];

const snippets = {
  React: {
    lang: 'tsx',
    code: `import { useNetworkStatus } from '@net-watch/react'

export function ConnectionBadge() {
  const { online, quality, rtt } = useNetworkStatus()

  if (!online) return <span>Offline</span>
  return <span>{quality}{rtt ? \`, \${rtt} ms\` : ''}</span>
}`,
  },
  Vue: {
    lang: 'vue',
    code: `<script setup lang="ts">
import { useNetworkStatus } from '@net-watch/vue'

const status = useNetworkStatus()
</script>

<template>
  <span v-if="!status.online">Offline</span>
  <span v-else>{{ status.quality }}<template v-if="status.rtt">, {{ status.rtt }} ms</template></span>
</template>`,
  },
  Angular: {
    lang: 'ts',
    code: `import { Component } from '@angular/core'
import { injectNetworkStatus } from '@net-watch/angular'

@Component({
  selector: 'app-connection-badge',
  template: \`
    @if (status().online) {
      <span>{{ status().quality }}</span>
    } @else {
      <span>Offline</span>
    }
  \`,
})
export class ConnectionBadge {
  status = injectNetworkStatus()
}`,
  },
  'Plain JavaScript': {
    lang: 'ts',
    code: `import { createNetworkWatcher } from '@net-watch/core'
import { watchFetch } from '@net-watch/core/fetch'
import { createBanner } from '@net-watch/core/banner'

const watcher = createNetworkWatcher({ pingUrl: '/api/ping' })

export const api = watchFetch(watcher) // use it like fetch
createBanner(watcher, { slowText: 'Slow connection' })

watcher.subscribe(({ online, quality, rtt }) => {
  console.log(online ? \`\${quality}, \${rtt ?? '?'} ms\` : 'offline')
})`,
  },
} as const;

const aiPrompt = `Add net-watch to this project.

1. Read https://YOUR-SITE/llms-full.txt (the net-watch docs in one file) before writing any code, and follow it instead of your memory.
2. Detect the framework. Install @net-watch/core and the matching adapter: @net-watch/react, @net-watch/vue or @net-watch/angular.
3. Create one watcher in its own module: createNetworkWatcher({ pingUrl: '/api/ping' }). Never create a watcher per component.
4. Add a /api/ping route to the backend that answers GET and HEAD with 204 and Cache-Control: no-store.
5. Replace the app's fetch with watchFetch(watcher) from @net-watch/core/fetch, so real requests are measured.
6. Mount createBanner(watcher, { slowText: 'Slow connection' }) from @net-watch/core/banner inside an effect, and destroy it on cleanup.
7. Show connection state with the framework adapter (useNetworkStatus or injectNetworkStatus).

Do not poll navigator.onLine yourself. Do not invent options: only use what the docs list. Run the type checker when you are done.`;

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={sectionClass}>
      <div className={containerClass}>
        <h2 className={`${h2Class} max-w-[24ch]`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default async function HomePage() {
  return (
    <LiveAccent>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'WebSite', name: appName, url: siteUrl, description },
            {
              '@type': 'SoftwareSourceCode',
              name: appName,
              description,
              url: siteUrl,
              codeRepositoryUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
              programmingLanguage: 'TypeScript',
              license: 'https://opensource.org/licenses/MIT',
              author: { '@type': 'Person', name: gitConfig.user, url: `https://github.com/${gitConfig.user}` },
            },
            {
              '@type': 'SoftwareApplication',
              name: appName,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              url: npmUrl,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
          ],
        }}
      />
      <main className="flex-1">
        <div className={`${containerClass} grid items-start gap-10 py-12 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14`}>
          <div className="lg:pt-6">
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">Know when your users are really offline.</h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-fd-muted-foreground">
              net-watch checks whether the browser can reach your server, measures how fast the connection is, and hands you one state object. It works with React, Vue,
              Angular or plain JavaScript.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              <CopyCommand command="npm i @net-watch/core" />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs/quick-start"
                  className="inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
                >
                  Read the quick start
                </Link>
                <Link href="#ai" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-fd-accent">
                  Copy the AI prompt
                </Link>
              </div>
            </div>
            <p className="mt-8 max-w-[52ch] text-sm leading-relaxed text-fd-muted-foreground">
              Under 3 kB gzipped, no dependencies. Runs in Chrome, Edge, Firefox and Safari. The panel on this page is the library measuring your connection right now, and the
              line at the very top of the page changes colour with it.
            </p>
          </div>
          <Telemetry />
        </div>

        <Section title="navigator.onLine only knows that a network interface is up">
          <p className={`${proseClass} mt-6`}>
            &quot;Online&quot; only means the device has a network interface. Apps that trust it keep showing a happy state while every request fails, and polling to fix that costs
            every visitor battery and data, all day.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {situations.map((row) => (
              <li key={row.title} className="flex flex-col rounded-lg border bg-fd-card p-4">
                <h3 className="font-display text-xl font-semibold">{row.title}</h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">{row.detail}</p>
                <dl className="mt-auto grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 pt-5 text-xs">
                  <dt className="text-fd-muted-foreground">Browser says</dt>
                  <dd>
                    <span className="inline-block rounded border bg-fd-muted/60 px-2 py-0.5 font-mono text-fd-muted-foreground">{row.browser}</span>
                  </dd>
                  <dt className="text-fd-muted-foreground">net-watch says</dt>
                  <dd>
                    <span className="inline-block rounded border px-2 py-0.5 font-mono font-medium" style={tint(row.tone)}>
                      {row.netWatch}
                    </span>
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[62ch] border-l-2 border-[var(--nw-accent)] pl-4 text-lg leading-relaxed">
            The reverse is reliable: when the browser says it is offline, it is. net-watch starts from that and checks the rest.
          </p>
        </Section>

        <Section title="It asks the network only when something looks wrong">
          <p className={`${proseClass} mt-6`}>
            net-watch collects evidence that costs nothing first, and sends a request of its own only when that evidence disagrees or goes quiet. Online and idle, it sends
            nothing beyond a check at startup and one when the tab returns to view, unless you opt in to a heartbeat.
          </p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {evidence.map((step, i) => (
              <li key={step.title} className="flex flex-col rounded-lg border bg-fd-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-fd-muted-foreground">0{i + 1}</span>
                  <span className="rounded border px-2 py-0.5 font-mono text-xs font-medium" style={tint(step.tone)}>
                    {step.cost}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-fd-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
          <Diagram
            src="/diagrams/detection-flow.svg"
            alt="Flowchart: a signal arrives. If the browser says offline, the state is Offline. If your server answered a real request, the state is Online and no probe is sent. Otherwise one probe runs: an answer means Online, no answer means Offline, which retries with backoff."
            caption="What happens when a signal arrives. The probe is the only request net-watch sends, and only when the first two checks cannot decide."
          />
          <p className="max-w-[62ch] text-sm text-fd-muted-foreground">
            The result is one immutable state object. It changes only when a value changes after rounding, so similar measurements do not re-render your UI.{' '}
            <Link href="/docs/concepts/how-it-works" className="font-medium text-fd-foreground underline underline-offset-4">
              See the full flow, with diagrams
            </Link>
          </p>
        </Section>

        <Section title="Latency, quality and download speed from what the browser already measures">
          <ol className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {qualityBands.map((band) => (
              <li key={band.name} className="rounded-lg border bg-fd-card p-4">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: `var(--nw-${band.tone})` }} aria-hidden />
                <p className="mt-3 font-display text-2xl font-semibold">{band.name}</p>
                <p className="mt-0.5 font-mono text-sm text-fd-muted-foreground">{band.range}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 max-w-[62ch] text-sm text-fd-muted-foreground">
            Quality is read from smoothed latency. It improves only after latency falls well below a boundary, so the label does not flicker.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {measures.map((item) => (
              <div key={item.title} className="rounded-lg border p-5">
                <p className="font-mono text-sm font-medium text-fd-muted-foreground">{item.field}</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-fd-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-3xl overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-fd-muted/60">
                <tr>
                  <th className="px-3 py-2 font-medium">State field</th>
                  <th className="px-3 py-2 font-medium">Where you get it</th>
                </tr>
              </thead>
              <tbody>
                {stateFields.map((row) => (
                  <tr key={row.field} className="border-t align-top">
                    <td className="px-3 py-2.5 font-mono text-xs">{row.field}</td>
                    <td className="px-3 py-2.5">{row.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6">
            <Link href="/docs/concepts/network-quality" className="font-medium text-fd-foreground underline underline-offset-4">
              How the numbers are computed
            </Link>
          </p>
        </Section>

        <Section title="One state object in whatever framework you use">
          <p className={`${proseClass} mt-6`}>
            The core has no framework code. Each adapter is about ten lines that turn the same state into a React hook, a Vue computed value or an Angular signal, and weighs
            under 400 bytes. Plain JavaScript works the same way through <code className="font-mono text-sm">subscribe</code>.
          </p>
          <div className="mt-8 max-w-3xl">
            <Tabs items={Object.keys(snippets)}>
              {Object.entries(snippets).map(([name, { lang, code }]) => (
                <Tab key={name} value={name}>
                  <ServerCodeBlock code={code} lang={lang} themes={{ light: 'github-light', dark: 'github-dark' }} />
                </Tab>
              ))}
            </Tabs>
          </div>
        </Section>

        <Section id="ai" title="Give your AI assistant the context it needs">
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <div className={proseClass}>
              <p>
                Assistants write better integration code when they read the real documentation instead of guessing from memory. This site is built for that: every page is
                available as Markdown, and two index files list everything.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <a href="/llms.txt" className="font-mono text-base text-fd-foreground underline underline-offset-4">
                    /llms.txt
                  </a>{' '}
                  lists every page with its description.
                </li>
                <li>
                  <a href="/llms-full.txt" className="font-mono text-base text-fd-foreground underline underline-offset-4">
                    /llms-full.txt
                  </a>{' '}
                  contains all the documentation in one file.
                </li>
                <li>
                  Add <code className="font-mono text-base text-fd-foreground">.md</code> to any docs URL to get that page as Markdown.
                </li>
              </ul>
              <p>
                Paste the prompt on the right into your assistant to add net-watch to a project.{' '}
                <Link href="/docs/ai/use-with-ai" className="font-medium text-fd-foreground underline underline-offset-4">
                  More prompts and a rules snippet for AGENTS.md
                </Link>
              </p>
            </div>
            <Prompt title="Add net-watch to my app">{aiPrompt}</Prompt>
          </div>
        </Section>

        <Section title="Small, dependency-free, and tested in three engines">
          <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-medium">Size</dt>
              <dd className="mt-1 text-fd-muted-foreground">
                The core is under 3 kB gzipped. The banner adds about 2 kB and <code className="font-mono text-sm">watchFetch</code> about 0.3 kB. No runtime dependencies.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Browsers</dt>
              <dd className="mt-1 text-fd-muted-foreground">Chrome and Edge 90, Firefox 90, Safari and iOS 15 or newer. Every test runs in real Chromium, Firefox and WebKit.</dd>
            </div>
            <div>
              <dt className="font-medium">Server rendering</dt>
              <dd className="mt-1 text-fd-muted-foreground">Safe to import and create without a window. Nothing runs on the server, and React gets a proper server snapshot.</dd>
            </div>
            <div>
              <dt className="font-medium">Types</dt>
              <dd className="mt-1 text-fd-muted-foreground">Written in TypeScript with strict settings. Every field of the state is typed, and unknown values are explicit.</dd>
            </div>
          </dl>
        </Section>

        <section className={sectionClass}>
          <div className={`${containerClass} flex flex-col items-start gap-6`}>
            <h2 className={`${h2Class} max-w-[22ch]`}>Add it in the time it takes to read this page.</h2>
            <CopyCommand command="npm i @net-watch/core" />
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Read the quick start
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-sm text-fd-muted-foreground">
        <div className={`${containerClass} flex flex-wrap items-center justify-between gap-4`}>
          <p>MIT licensed. Built with Fumadocs.</p>
          <nav className="flex flex-wrap gap-5" aria-label="Footer">
            <Link href="/docs" className="hover:text-fd-foreground">
              Docs
            </Link>
            <a href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`} className="hover:text-fd-foreground">
              GitHub
            </a>
            <a href={npmUrl} className="hover:text-fd-foreground">
              npm
            </a>
            <a href="/llms.txt" className="hover:text-fd-foreground">
              llms.txt
            </a>
          </nav>
        </div>
      </footer>
    </LiveAccent>
  );
}
