'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useNetworkStatus } from '@net-watch/react';
import {
  EMPTY,
  demoWatcher,
  rawSamples,
  runSpeedCheck,
  sendRequest,
  simulateOffline,
  smoothedPoints,
  toneOf,
  type RawSample,
  type SmoothedPoint,
  type SpeedResult,
  type Tone,
} from '@/lib/demo';

// Latency is drawn on a scale that gives every quality band the same height, so a jump from 400 ms to 1400 ms reads
// as a step up a band and not as a flat line next to 3000 ms.
const SCALE = [0, 150, 400, 1400, 3000];
function position(ms: number) {
  const value = Math.min(Math.max(ms, 0), SCALE[SCALE.length - 1]!);
  for (let i = 0; i < SCALE.length - 1; i++) {
    const low = SCALE[i]!;
    const high = SCALE[i + 1]!;
    if (value <= high) return (i + (value - low) / (high - low)) / (SCALE.length - 1);
  }
  return 1;
}

const WINDOW_MS = 60_000;
const W = 480;
const H = 112;
const PAD = { top: 6, bottom: 6 };
const plotHeight = H - PAD.top - PAD.bottom;
const y = (ms: number) => PAD.top + (1 - position(ms)) * plotHeight;
const colour = (tone: Tone) => `var(--nw-${tone})`;
const dotTone = (ms: number): Tone => (ms < 400 ? 'good' : ms < 1400 ? 'slow' : 'bad');

const BANDS = [
  { name: 'excellent', range: 'under 150 ms', tone: 'good' as const },
  { name: 'good', range: '150 to 400 ms', tone: 'good' as const },
  { name: 'fair', range: '400 to 1400 ms', tone: 'slow' as const },
  { name: 'poor', range: '1400 ms and up', tone: 'bad' as const },
];

function Trace({ samples, points, now }: { samples: readonly RawSample[]; points: readonly SmoothedPoint[]; now: number }) {
  const start = now - WINDOW_MS;
  const x = (t: number) => ((t - start) / WINDOW_MS) * W;
  const visible = points.filter((p) => p.t >= start - WINDOW_MS);

  // A step line: the smoothed value holds until the next visible change.
  let path = '';
  let length = 0;
  let lastX = 0;
  let lastY = 0;
  visible.forEach((p, i) => {
    const px = Math.max(0, x(p.t));
    const py = y(p.rtt);
    if (i === 0) path = `M${px.toFixed(1)} ${py.toFixed(1)}`;
    else {
      path += ` H${px.toFixed(1)} V${py.toFixed(1)}`;
      length += Math.abs(px - lastX) + Math.abs(py - lastY);
    }
    lastX = px;
    lastY = py;
  });
  if (visible.length > 0) {
    path += ` H${W}`;
    length += W - lastX;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-28 w-full" role="img" aria-label="Latency of the last minute: dots are requests, the line is the smoothed value net-watch reports">
      {[150, 400, 1400].map((ms) => (
        <g key={ms}>
          <line x1="0" x2={W} y1={y(ms)} y2={y(ms)} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="3 4" />
          <text x={W - 2} y={y(ms) - 3} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.5" className="font-mono">
            {ms} ms
          </text>
        </g>
      ))}
      {path && (
        <path
          key={visible.length}
          d={path}
          className="nw-trace"
          style={{ ['--nw-len' as string]: Math.ceil(length) + 20 }}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
      )}
      {samples
        .filter((s) => s.t >= start)
        .map((s) => (
          <circle key={s.t} cx={x(s.t)} cy={y(s.ms)} r="3.2" fill={colour(dotTone(s.ms))} />
        ))}
    </svg>
  );
}

function Gauge({ rtt, tone }: { rtt: number | undefined; tone: Tone }) {
  return (
    <div>
      <div className="relative">
        <div className="flex h-2 overflow-hidden rounded-full">
          {BANDS.map((band) => (
            <div key={band.name} className="flex-1" style={{ background: colour(band.tone), opacity: 0.28 }} />
          ))}
        </div>
        {rtt !== undefined && (
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fd-background transition-[left] duration-500"
            style={{ left: `${position(rtt) * 100}%`, background: colour(tone) }}
          />
        )}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-xs text-fd-muted-foreground">
        {BANDS.map((band) => (
          <div key={band.name}>
            <div className="font-medium text-fd-foreground">{band.name}</div>
            <div className="font-mono text-[11px]">{band.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Readout({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fd-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-sm" title={hint}>
        {value}
      </dd>
    </div>
  );
}

const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    {...props}
    className="inline-flex items-center justify-center rounded-md border bg-fd-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nw-accent)] disabled:pointer-events-none disabled:opacity-50"
  >
    {children}
  </button>
);

export function Telemetry() {
  const state = useNetworkStatus(demoWatcher);
  const samples = useSyncExternalStore(rawSamples.subscribe, rawSamples.get, () => EMPTY);
  const points = useSyncExternalStore(smoothedPoints.subscribe, smoothedPoints.get, () => EMPTY);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState<string>();
  const [speed, setSpeed] = useState<SpeedResult | 'failed'>();

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tone = toneOf(state);
  const unknown = (value: unknown, text?: string) =>
    value === undefined ? <span className="text-fd-muted-foreground">unknown</span> : (text ?? String(value));

  async function run(name: string, task: () => Promise<unknown>) {
    setBusy(name);
    try {
      await task();
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <section aria-label="Live connection panel" className="rounded-xl border bg-fd-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div aria-live="polite">
          <div className="flex items-center gap-2.5">
            <span className="size-3 rounded-full transition-colors duration-500" style={{ background: colour(tone) }} />
            <span className="font-display text-3xl font-semibold leading-none tracking-tight">{state.online ? 'Online' : 'Offline'}</span>
          </div>
          <div className="mt-1.5 text-sm text-fd-muted-foreground">
            {state.since > 0 ? `since ${new Date(state.since).toLocaleTimeString()}` : 'checking this connection'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-4xl font-medium leading-none tabular-nums" style={{ color: colour(tone) }}>
            {state.rtt === undefined ? '--' : state.rtt}
            {state.rtt !== undefined && <span className="ml-1 text-base text-fd-muted-foreground">ms</span>}
          </div>
          <div className="mt-1.5 text-sm text-fd-muted-foreground">
            quality <span className="font-medium text-fd-foreground">{state.quality}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Gauge rtt={state.rtt} tone={tone} />
      </div>

      <div className="mt-4 text-fd-foreground">
        {now > 0 ? <Trace samples={samples} points={points} now={now} /> : <div className="h-28" />}
        <p className="mt-1 text-xs text-fd-muted-foreground">Last minute. Dots are your requests; the line is the smoothed latency net-watch reports.</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-4">
        <Readout label="download" value={unknown(state.downlink, `${state.downlink} Mbps`)} hint="From resource timing of large responses. Try the download button." />
        <Readout label="effective type" value={unknown(state.effectiveType)} hint="Chromium only" />
        <Readout label="link type" value={unknown(state.type)} hint="Chrome on Android and ChromeOS only" />
        <Readout label="data saver" value={state.saveData ? 'on' : 'off'} hint="Chromium only" />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Action disabled={!!busy} onClick={() => run('fast', () => sendRequest('/api/ping'))}>
          Send request
        </Action>
        <Action disabled={!!busy} onClick={() => run('slow', () => sendRequest('/api/slow?ms=3000'))}>
          Send slow request (3 s)
        </Action>
        <Action disabled={!!busy} onClick={() => run('download', () => sendRequest('/api/payload?kb=2048').then((r) => r?.response.arrayBuffer()))}>
          Download 2 MB
        </Action>
        <Action disabled={!!busy} onClick={simulateOffline}>
          Simulate offline
        </Action>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run('speed', async () => setSpeed((await runSpeedCheck()) ?? 'failed'))}
          className="inline-flex items-center justify-center rounded-md bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nw-accent)] disabled:pointer-events-none disabled:opacity-50"
        >
          {busy === 'speed' ? 'Measuring' : 'Run speed check'}
        </button>
      </div>

      <div aria-live="polite" className="mt-3 min-h-10 text-sm">
        {speed === 'failed' && <p className="text-fd-muted-foreground">The check could not finish. Are you offline?</p>}
        {speed && speed !== 'failed' && (
          <p>
            Latency <strong className="font-mono">{Math.round(speed.latency)} ms</strong> (median of 6 requests)
            {speed.download !== undefined && (
              <>
                , download <strong className="font-mono">{speed.download.toFixed(speed.download < 10 ? 1 : 0)} Mbps</strong> (1 MB)
              </>
            )}
            .
          </p>
        )}
        {!speed && (
          <p className="text-fd-muted-foreground">
            To test for real, switch on airplane mode or use DevTools, Network, Offline. The simulate button only fires the browser&apos;s offline event: net-watch then
            probes, finds the connection works, and recovers in about two seconds.
          </p>
        )}
      </div>
    </section>
  );
}
