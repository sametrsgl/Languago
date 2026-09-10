import type { APIRoute } from 'astro';

export const prerender = false;

// Convenience alias for crawlers/tools that request /sitemap.xml while
// @astrojs/sitemap emits /sitemap-index.xml.
export const GET: APIRoute = () => new Response(null, {
  status: 302,
  headers: { Location: '/sitemap-index.xml' },
});
