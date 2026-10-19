import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // `next dev` would otherwise write apps/docs/AGENTS.md and CLAUDE.md; the repository root AGENTS.md already covers agents.
  agentRules: false,
};

export default withMDX(config);
