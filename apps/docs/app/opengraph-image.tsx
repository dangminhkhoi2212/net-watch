import { generateOGImage } from 'fumadocs-ui/og';
import { appName, tagline } from '@/lib/shared';

export const alt = `${appName}: ${tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return generateOGImage({ title: appName, description: tagline, site: appName });
}
