import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Logo } from '@/components/logo';
import { appName, gitConfig, npmUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Logo />
          {appName}
        </span>
      ),
    },
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Use with AI', url: '/docs/ai/use-with-ai' },
      { text: 'npm', url: npmUrl, external: true },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
