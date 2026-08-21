import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
import sitemap from '@astrojs/sitemap';

// Public site URL placeholder — override at deploy time with SITE_URL.
const SITE_URL = process.env.SITE_URL || 'https://www.languago.site';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
});