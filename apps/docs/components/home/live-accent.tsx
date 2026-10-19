'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useNetworkStatus } from '@net-watch/react';
import { createBanner } from '@net-watch/core/banner';
import { demoWatcher, toneOf } from '@/lib/demo';

/**
 * Wraps the landing page. It does two things with the visitor's real connection:
 * the page accent follows its state, and the net-watch banner is mounted (try DevTools, Network, Offline).
 */
export function LiveAccent({ children }: { children: ReactNode }) {
  const state = useNetworkStatus(demoWatcher);
  const tone = toneOf(state);

  useEffect(() => {
    const root = document.documentElement;
    const banner = createBanner(demoWatcher, { slowText: 'Slow connection', theme: root.classList.contains('dark') ? 'dark' : 'light' });
    // The site theme switch toggles a class on <html>; keep the banner in step with it.
    const observer = new MutationObserver(() => banner.setTheme(root.classList.contains('dark') ? 'dark' : 'light'));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      banner.destroy();
    };
  }, []);

  return (
    <div data-tone={tone} style={{ '--nw-accent': `var(--nw-${tone})` } as CSSProperties} className="flex flex-1 flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-[var(--nw-accent)] transition-colors duration-500" />
      {children}
    </div>
  );
}
