'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const platforms = [
  {
    name: 'JavaScript',
    href: '/docs',
    prefix: null,
    icon: icon(
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M10 8v6.5a1.5 1.5 0 0 1-3 0M14.5 15.5c.4.7 1 1 1.8 1 1 0 1.7-.5 1.7-1.3 0-1.9-3.4-1-3.4-3 0-.8.7-1.3 1.6-1.3.8 0 1.4.3 1.7.9" />
      </>,
    ),
  },
  {
    name: 'React',
    href: '/docs/react',
    prefix: '/docs/react',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </>,
    ),
  },
  {
    name: 'Vue',
    href: '/docs/vue',
    prefix: '/docs/vue',
    icon: icon(
      <>
        <path d="M2 3h4.5L12 12.5 17.5 3H22L12 20.5z" />
        <path d="M7 3l5 8.5L17 3" />
      </>,
    ),
  },
  {
    name: 'Angular',
    href: '/docs/angular',
    prefix: '/docs/angular',
    icon: icon(
      <>
        <path d="M12 2.5l8.5 3-1.3 11L12 21.5l-7.2-5 -1.3-11z" />
        <path d="M12 7.5l3.3 8h-1.5l-.7-1.8h-2.2l-.7 1.8H8.7z" />
      </>,
    ),
  },
];

const isActive = (pathname: string, prefix: string | null) =>
  prefix === null
    ? !platforms.some((p) => p.prefix && (pathname === p.prefix || pathname.startsWith(`${p.prefix}/`)))
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

/** The platform switcher at the top of the docs sidebar: one entry per package, the current one highlighted. */
export function PlatformTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Platforms" className="mb-2 flex flex-col gap-1">
      {platforms.map((platform) => {
        const active = isActive(pathname, platform.prefix);
        return (
          <Link
            key={platform.name}
            href={platform.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-fd-primary/10 text-fd-primary' : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground'
            }`}
          >
            <span className={`grid size-8 place-items-center rounded-md border ${active ? 'border-fd-primary/30 bg-fd-primary/10' : 'bg-fd-card'}`}>{platform.icon}</span>
            {platform.name}
          </Link>
        );
      })}
    </nav>
  );
}
