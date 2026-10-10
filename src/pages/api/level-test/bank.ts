import type { APIRoute } from 'astro';
import { publicBank } from '../../../lib/level-test-bank';

export const prerender = false;

/** The test's questions without answer keys or listening scripts. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(publicBank()), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
