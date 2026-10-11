import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { loadPathState } from '../../../lib/path-content';
import { bank, isCorrect } from '../../../lib/level-test-bank';
import { DAYS_PER_LEVEL, PASS } from '../../../lib/path.mjs';
import { hash, rng } from '../../../lib/level-test.mjs';

export const prerender = false;

/**
 * End-of-level exam: 12 vocabulary, 12 grammar and two reading texts (8
 * questions) of the learner's level, from the level-test bank. Opens after
 * the level's last mission day; 85 moves the learner up.
 */
function examFor(level: string, seed: number) {
  const b = bank();
  const r = rng(seed);
  const pick = <T,>(arr: T[], n: number) => [...arr].sort(() => r() - 0.5).slice(0, n);
  const strip = (i: any) => ({ id: i.id, stem: i.stem, options: i.options });
  const items = [
    ...pick(b.items.filter((i) => i.skill === 'vocab' && i.level === level), 12),
    ...pick(b.items.filter((i) => i.skill === 'grammar' && i.level === level), 12),
  ].map(strip);
  const texts = pick(b.units.filter((u) => u.skill === 'reading' && u.level === level), 2)
    .map((u) => ({ title: u.title, text: u.text, questions: u.questions.map(strip) }));
  return { items, texts };
}

export const GET: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const st = await loadPathState(u.sb, u.userId);
  if (!st) return json(500, { ok: false });
  if (st.mission_day <= DAYS_PER_LEVEL) return json(403, { ok: false, error: 'Sınav, seviyenin tüm görevleri bitince açılır.' });
  const { count } = await u.sb.from('level_exams').select('id', { count: 'exact', head: true }).eq('student_id', u.userId).eq('level', st.mission_level);
  return json(200, { ok: true, level: st.mission_level, ...examFor(st.mission_level, hash(u.userId) + (count ?? 0) * 7919) });
};

export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 8000)); } catch { return json(400, { ok: false }); }
  const st = await loadPathState(u.sb, u.userId);
  if (!st) return json(500, { ok: false });
  const { count } = await u.sb.from('level_exams').select('id', { count: 'exact', head: true }).eq('student_id', u.userId).eq('level', st.mission_level);
  const exam = examFor(st.mission_level, hash(u.userId) + (count ?? 0) * 7919);
  const ids = [...exam.items.map((i) => i.id), ...exam.texts.flatMap((t) => t.questions.map((q) => q.id))];
  const answers = body.answers || {};
  const right = ids.filter((id) => isCorrect(id, Number(answers[id])) === true).length;
  const score = Math.round((right / ids.length) * 100);
  const { data, error } = await u.sb.rpc('submit_level_exam', { p_score: score, p_days: DAYS_PER_LEVEL });
  if (error) return json(400, { ok: false, error: 'Sınav kaydedilemedi.' });
  return json(200, { ok: true, score, passed: score >= PASS, next: data?.next ?? null, right, total: ids.length });
};
