import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // `next dev` would otherwise write apps/docs/AGENTS.md and CLAUDE.md; the repository root AGENTS.md already covers agents.
  agentRules: false,
  // The framework pages moved out of /docs/frameworks. Published READMEs still link to the old URLs.
  async redirects() {
    return ['react', 'vue', 'angular'].map((name) => ({
      source: `/docs/frameworks/${name}`,
      destination: `/docs/${name}`,
      permanent: true,
    }));
  },
};

export default withMDX(config);
