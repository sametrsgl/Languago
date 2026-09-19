import type { APIRoute } from 'astro';
import { assessmentQuestions } from '../../../lib/assessment-pool';

const MAX_BODY_BYTES = 2_048;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: 'İstek gövdesi çok büyük.' }, 413);

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Geçersiz istek.' }, 400);
  }

  const id = typeof body?.id === 'string' ? body.id : '';
  const selectedIndex = Number.isInteger(body?.selectedIndex) ? body.selectedIndex : -1;
  const question = assessmentQuestions.find((item) => item.id === id);
  if (!question || selectedIndex < 0 || selectedIndex >= question.options.length) return json({ error: 'Geçersiz soru veya cevap.' }, 400);

  return json({
    correct: selectedIndex === question.answer,
    correctIndex: question.answer,
    why: question.why || '',
  }, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
