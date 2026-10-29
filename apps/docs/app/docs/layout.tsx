import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { PlatformTabs } from '@/components/platform-tabs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    // The platform list replaces Fumadocs' dropdown. Each platform is a `root: true` folder in content/docs, which is
    // what limits the sidebar tree to that platform's pages.
    <DocsLayout tree={source.getPageTree()} tabs={false} sidebar={{ banner: <PlatformTabs /> }} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
