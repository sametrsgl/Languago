import type { APIRoute } from 'astro';
import { publicAssessmentPool } from '../../../lib/assessment-pool';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify(publicAssessmentPool), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  },
});
