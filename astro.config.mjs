import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Public site URL placeholder — override at deploy time with SITE_URL.
const SITE_URL = process.env.SITE_URL || 'https://www.languago.site';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: vercel(),
  integrations: [
    sitemap({
      customPages: [`${SITE_URL}/blog`],
    }),
  ],
  // Scoped Tailwind (v4) wiring — used only by the vocab flashcards page via
  // src/styles/vocab.css. No preflight is emitted (see that file), so this
  // never resets existing global.css / AppLayout styles.
  vite: {
    plugins: [tailwindcss()],
  },
});