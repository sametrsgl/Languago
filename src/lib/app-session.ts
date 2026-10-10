// Who is using /app: the signed-in user, their role and the data the
// "Bugün" home needs. A local-only demo (?demo=ogrenci|ogretmen on the dev
// server) previews the screens without a Supabase session; it never runs on
// the live site.
import { createSupabaseClient, pageCookieSource } from './supabase';
import { streakFromRows, totalXp, levelFromXp } from './gamification';

export type AppRole = 'student' | 'teacher' | 'admin' | 'parent';

export type NextLesson = { id: string; title: string; startsAt: string; roomToken: string };

export type StudentHome = {
  streak: number;
  xp: number;
  level: number;
  modulesDone: number;
  nextLesson: NextLesson | null;
};

export type TeacherHome = {
  lessons: NextLesson[];
  students: number;
  classes: number;
};

export type AppSession = {
  demo: boolean;
  userId: string;
  firstName: string;
  email: string;
  role: AppRole;
  student?: StudentHome;
  teacher?: TeacherHome;
};

type AstroLike = Parameters<typeof pageCookieSource>[0] & { url: URL };

function demoSession(kind: string): AppSession {
  const soon = new Date(Date.now() + 3 * 3600_000).toISOString();
  if (kind === 'ogretmen') {
    return {
      demo: true, userId: 'demo-teacher', firstName: 'Samet', email: 'ogretmen@ornek.com', role: 'teacher',
      teacher: {
        students: 18, classes: 4,
        lessons: [
          { id: 'l1', title: 'Elif · Birebir · Past simple ile hikâye', startsAt: soon, roomToken: 'demo-1' },
          { id: 'l2', title: 'B1 Konuşma kulübü · 5 öğrenci', startsAt: new Date(Date.now() + 5 * 3600_000).toISOString(), roomToken: 'demo-2' },
          { id: 'l3', title: 'Can · IELTS Writing Task 2', startsAt: new Date(Date.now() + 26 * 3600_000).toISOString(), roomToken: 'demo-3' },
        ],
      },
    };
  }
  return {
    demo: true, userId: 'demo-student', firstName: 'Elif', email: 'ogrenci@ornek.com', role: 'student',
    student: { streak: 7, xp: 1240, level: 13, modulesDone: 3, nextLesson: { id: 'l1', title: 'Past simple ile hikâye anlatmak', startsAt: soon, roomToken: 'demo-1' } },
  };
}

/** The /app session, or a path to redirect to. */
export async function loadAppSession(Astro: AstroLike): Promise<AppSession | { redirect: string }> {
  const demo = Astro.url.searchParams.get('demo');
  if (import.meta.env.DEV && demo) return demoSession(demo);

  const supabase = createSupabaseClient(pageCookieSource(Astro));
  if (!supabase) return { redirect: '/signin?next=/app' };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { redirect: '/signin?next=/app' };
  const user = data.user;
  const fullName = String(user.user_metadata?.full_name || '').trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : (user.email || '').split('@')[0];

  let role: AppRole = 'student';
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const r = profile?.role as AppRole | undefined;
    if (r === 'teacher' || r === 'admin' || r === 'parent') role = r;
  } catch { /* stays student */ }

  const session: AppSession = { demo: false, userId: user.id, firstName, email: user.email || '', role };
  const nowIso = new Date(Date.now() - 45 * 60_000).toISOString(); // a lesson in progress still shows

  if (role === 'teacher' || role === 'admin') {
    const [lessons, students, classes] = await Promise.all([
      supabase.from('lessons').select('id, title, starts_at, room_token').eq('teacher_id', user.id).gte('starts_at', nowIso).order('starts_at').limit(6),
      supabase.rpc('get_teacher_students', { p_teacher: user.id }),
      supabase.from('class_roster').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
    ]).catch(() => [null, null, null] as const);
    session.teacher = {
      lessons: ((lessons?.data as any[]) || []).map((l) => ({ id: l.id, title: l.title, startsAt: l.starts_at, roomToken: l.room_token })),
      students: Array.isArray(students?.data) ? students!.data.length : 0,
      classes: classes?.count ?? 0,
    };
    return session;
  }

  const [rows, lesson] = await Promise.all([
    supabase.from('student_progress').select('module, payload, updated_at').eq('student_id', user.id),
    supabase.from('lessons').select('id, title, starts_at, room_token').gte('starts_at', nowIso).order('starts_at').limit(1),
  ]).catch(() => [null, null] as const);
  const progress = (rows?.data as any[]) || [];
  const xp = totalXp(progress);
  const l = (lesson?.data as any[])?.[0];
  session.student = {
    streak: streakFromRows(progress),
    xp,
    level: levelFromXp(xp).level,
    modulesDone: progress.length,
    nextLesson: l ? { id: l.id, title: l.title, startsAt: l.starts_at, roomToken: l.room_token } : null,
  };
  return session;
}
