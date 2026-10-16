import Link from 'next/link';
import type { Metadata } from 'next';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { CopyCommand } from '@/components/home/copy-button';
import { LiveAccent } from '@/components/home/live-accent';
import { Telemetry } from '@/components/home/telemetry';
import { Prompt } from '@/components/prompt';
import { description, gitConfig, npmUrl, tagline } from '@/lib/shared';

export const metadata: Metadata = {
  title: { absolute: 'net-watch: know when your users are really offline' },
  description,
  openGraph: { title: 'net-watch', description: tagline },
};

const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const sectionClass = 'border-t py-16 md:py-24';
const h2Class = 'font-display text-3xl font-semibold tracking-tight sm:text-4xl';
const proseClass = 'max-w-[62ch] space-y-4 text-lg leading-relaxed text-fd-muted-foreground';

const situations = [
  { situation: 'Wi-Fi is connected but the router has no internet', browser: 'online', netWatch: 'offline' },
  { situation: 'Hotel or airport Wi-Fi is waiting for a sign-in page', browser: 'online', netWatch: 'offline' },
  { situation: 'A VPN, Docker or virtual adapter is up and Wi-Fi is off', browser: 'online', netWatch: 'offline' },
  { situation: 'Your server is down or blocked by a firewall', browser: 'online', netWatch: 'offline' },
  { situation: 'You are in a tunnel: connected, but every request takes seconds', browser: 'online', netWatch: 'online, quality poor' },
  { situation: 'Airplane mode', browser: 'offline', netWatch: 'offline' },
];

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
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
            <div className={proseClass}>
              <p>
                The browser reports &quot;online&quot; as soon as the device has a network interface. It does not know whether the router behind it has internet, whether the Wi-Fi is
                waiting for a sign-in page, or whether your own server can be reached.
              </p>
              <p>
                Apps that trust it keep showing a happy state while every request fails. Users stare at a spinner, retry by hand, and blame your app. The reverse direction is
                reliable: when the browser says it is offline, it is. net-watch starts from that fact and checks the rest.
              </p>
              <p>
                Hooks that only wrap the online and offline events inherit the same blind spot. Polling an endpoint every few seconds fixes it, but spends battery and data on every
                visitor, all day, to answer a question that only matters when something goes wrong.
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-fd-muted/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Situation</th>
                    <th className="px-3 py-2 font-medium">Browser says</th>
                    <th className="px-3 py-2 font-medium">net-watch says</th>
                  </tr>
                </thead>
                <tbody>
                  {situations.map((row) => (
                    <tr key={row.situation} className="border-t align-top">
                      <td className="px-3 py-2.5">{row.situation}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{row.browser}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{row.netWatch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="It asks the network only when something looks wrong">
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className={proseClass}>
              <p>
                net-watch collects evidence from sources that cost nothing and sends a request of its own only when those sources disagree or go quiet. While the app is online
                and idle it sends nothing beyond a check at startup and one when the tab comes back into view, unless you opt in to a heartbeat.
              </p>
              <p>
                The result is one immutable state object. It changes only when a value changes after rounding, so a stream of similar measurements does not re-render your UI.
              </p>
              <p>
                <Link href="/docs/concepts/how-it-works" className="font-medium text-fd-foreground underline underline-offset-4">
                  See the full flow, with diagrams
                </Link>
              </p>
            </div>
            <ol className="space-y-6 border-l pl-6">
              <li>
                <h3 className="font-display text-xl font-semibold">The browser&apos;s own signals</h3>
                <p className="mt-1 text-fd-muted-foreground">
                  The online and offline events, the tab becoming visible again, and a page restored from the back and forward cache. A report of &quot;offline&quot; is trusted at
                  once.
                </p>
              </li>
              <li>
                <h3 className="font-display text-xl font-semibold">Your own requests</h3>
                <p className="mt-1 text-fd-muted-foreground">
                  Wrap <code className="font-mono text-sm">fetch</code> once. Every response proves the network works and becomes a latency sample. A network error raises a
                  suspicion.
                </p>
              </li>
              <li>
                <h3 className="font-display text-xl font-semibold">A probe, when needed</h3>
                <p className="mt-1 text-fd-muted-foreground">
                  A tiny HEAD request to your ping endpoint settles a suspicion. While offline it retries after 2 seconds, then 4, 8 and so on up to 30, and stops as soon as the
                  connection is back.
                </p>
              </li>
            </ol>
          </div>
        </Section>

        <Section title="Latency, quality and download speed from what the browser already measures">
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className={proseClass}>
              <p>
                Every probe and every request you send yields a time to first byte. net-watch smooths those samples, rounds them to 50 ms, and sorts the result into four quality
                bands: excellent under 150 ms, good under 400, fair under 1400, and poor above. A quality level improves only after latency falls well below a boundary, so the
                label does not flicker.
              </p>
              <p>
                Download speed comes from the browser&apos;s resource timing of large responses you already loaded. There are no test files to download and no extra data for
                your users to pay for. If you want a number on demand, load a large file (50 kB or more, from your own origin or with a Timing-Allow-Origin header) that is not served from cache, and the value updates.
              </p>
              <p>
                Some things are not available to web pages in any browser, such as Wi-Fi signal strength. net-watch leaves those fields out instead of guessing, and a value the
                browser does not expose is simply <code className="font-mono text-sm">undefined</code>.
              </p>
              <p>
                <Link href="/docs/concepts/network-quality" className="font-medium text-fd-foreground underline underline-offset-4">
                  How the numbers are computed
                </Link>
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border">
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
          </div>
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
