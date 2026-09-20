import type { APIRoute } from 'astro';
import learningSyllabus from '../../data/learning-syllabus.json';
import { createSupabaseClient, pageCookieSource } from '../../lib/supabase';
import { readJsonBody, RequestBodyError } from '../../lib/request-body';
import {
  buildDailyLearningPlan,
  mergeCompletedGoal,
  normalizeDateKey,
} from '../../lib/daily-learning-plan.mjs';

export const prerender = false;

const MODULE = 'daily-plan';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
type SupabaseClient = NonNullable<ReturnType<typeof createSupabaseClient>>;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function requestedDate(value: unknown) {
  const date = String(value ?? '').trim();
  return DATE_PATTERN.test(date) ? date : normalizeDateKey();
}

async function readStudentState(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('student_progress')
    .select('module, payload, updated_at')
    .eq('student_id', userId);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function persistPlan(supabase: SupabaseClient, userId: string, plan: Record<string, unknown>) {
  const { error } = await supabase.from('student_progress').upsert(
    { student_id: userId, module: MODULE, payload: plan },
    { onConflict: 'student_id,module' },
  );
  if (error) throw error;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  try {
    const rows = await readStudentState(supabase, authData.user.id);
    const storedRow = rows.find((row) => row?.module === MODULE);
    const storedPlan = storedRow?.payload && typeof storedRow.payload === 'object' ? storedRow.payload : null;
    const date = requestedDate(new URL(request.url).searchParams.get('date'));
    const plan = buildDailyLearningPlan({
      date,
      progress: rows,
      storedPlan,
      syllabus: learningSyllabus,
    });

    // Persist the generated plan so goal completion has one canonical server-side record.
    if (!storedPlan || storedPlan.date !== plan.date) await persistPlan(supabase, authData.user.id, plan);
    return json({ ok: true, plan });
  } catch {
    return json({ error: 'Günlük plan hazırlanamadı.' }, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await readJsonBody<unknown>(request, 8_192);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Geçersiz istek.' }, 400);
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestBodyError) return json({ error: error.status === 413 ? 'İstek çok büyük.' : 'Geçersiz JSON.' }, error.status);
    return json({ error: 'Geçersiz istek.' }, 400);
  }

  const goalId = String(body.goalId ?? '').trim();
  if (!goalId || goalId.length > 120) return json({ error: 'Geçersiz hedef.' }, 400);

  try {
    const rows = await readStudentState(supabase, authData.user.id);
    const storedRow = rows.find((row) => row?.module === MODULE);
    const storedPlan = storedRow?.payload && typeof storedRow.payload === 'object' ? storedRow.payload : null;
    const date = requestedDate(body.date);
    if (storedPlan && storedPlan.date !== date) return json({ error: 'Plan güncel değil; sayfayı yenile.' }, 409);

    const plan = buildDailyLearningPlan({
      date,
      progress: rows,
      storedPlan,
      syllabus: learningSyllabus,
    });
    const result = mergeCompletedGoal(plan, goalId, String(body.output ?? ''));
    if (!result.ok) {
      return json({ error: result.error === 'output_too_short' ? 'Üretim hedefi için en az üç kelime yaz.' : 'Geçersiz hedef.' }, 400);
    }

    const nextPlan = {
      ...result.plan,
      history: Array.isArray(storedPlan.history) ? storedPlan.history.slice(-14) : [],
    };
    await persistPlan(supabase, authData.user.id, nextPlan);
    return json({ ok: true, plan: nextPlan });
  } catch {
    return json({ error: 'Hedef kaydedilemedi.' }, 500);
  }
};
