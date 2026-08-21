import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Public site URL placeholder — override at deploy time with SITE_URL.
const SITE_URL = process.env.SITE_URL || 'https://kingfish.lingobranch.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
});