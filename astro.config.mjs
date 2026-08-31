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
  adapter: vercel({
    // Material Maker renders HTML→PDF server-side (puppeteer-core +
    // @sparticuz/chromium). The LLM call (OpenCode Go / deepseek-v4-pro) is
    // the bottleneck — measured ~40–60s per generation — so give the function
    // headroom. Vercel Pro allows up to 300s; Hobby clamps to 60s.
    maxDuration: 300,
    // @sparticuz/chromium ships its Linux Chromium binary in `bin/` and must
    // stay in node_modules at runtime (it resolves that path at run time, so
    // nft's require-tracing misses the .br files). Force-include them.
    includeFiles: [
      'node_modules/@sparticuz/chromium/bin/chromium.br',
      'node_modules/@sparticuz/chromium/bin/fonts.tar.br',
      'node_modules/@sparticuz/chromium/bin/swiftshader.tar.br',
      'node_modules/@sparticuz/chromium/bin/al2023.tar.br',
    ],
  }),
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
    ssr: {
      // Both packages must NOT be bundled: puppeteer-core is huge and does
      // dynamic requires; @sparticuz/chromium resolves its `bin/` dir relative
      // to its own files, which breaks when Vite relocates them into the bundle.
      external: ['puppeteer-core', '@sparticuz/chromium'],
    },
  },
});