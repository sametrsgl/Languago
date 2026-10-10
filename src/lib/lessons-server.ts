// Server side of the timetable: Meet links and the emails around a lesson.
// Runs with the signed-in user's Supabase client; the database functions and
// row rules decide what each side may see and do.
import { sendEmail, mailLayout } from './notify';
import { googleReady, createMeetEvent, deleteEvent } from './google';
import { whenLabel, googleCalendarLink, joinUrl } from './timetable';

type Sb = { from: (t: string) => any; rpc: (fn: string, args?: Record<string, unknown>) => any };

export const APPT_COLS = 'id, teacher_id, student_id, class_id, kind, title, starts_at, ends_at, status, created_by, note, meet_url, calendar_event_id, room_token';
export type Appt = {
  id: string; teacher_id: string; student_id: string | null; class_id: string | null;
  kind: 'one_on_one' | 'group' | 'instant'; title: string | null; starts_at: string; ends_at: string;
  status: string; created_by: string; note: string | null; meet_url: string | null;
  calendar_event_id: string | null; room_token: string;
};
export type Person = { role: 'teacher' | 'student'; user_id: string; full_name: string | null; email: string | null };

export function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export function siteOrigin(request: Request): string {
  const configured = import.meta.env.SITE_URL as string | undefined;
  try { if (configured) return new URL(configured).origin; } catch { /* fall back */ }
  return new URL(request.url).origin;
}

export function lessonTitle(a: Pick<Appt, 'title' | 'kind'>): string {
  return a.title || (a.kind === 'one_on_one' ? 'Birebir İngilizce dersi' : 'İngilizce dersi');
}

export async function getPeople(sb: Sb, id: string): Promise<Person[]> {
  const { data } = await sb.rpc('lesson_people', { p_id: id });
  return Array.isArray(data) ? (data as Person[]) : [];
}
const nameOf = (p?: Person) => (p?.full_name || '').trim() || (p?.email || '').split('@')[0] || 'Öğrenci';

/**
 * Give a confirmed lesson its Meet link (teacher's session): a Google Calendar
 * event when the teacher connected Google, else their own Meet link, else the
 * Languago room. Returns where the lesson is held.
 */
export async function attachMeet(sb: Sb, a: Appt, people: Person[]): Promise<{ url: string; via: 'google' | 'own' | 'room' }> {
  if (googleReady()) {
    const { data: link } = await sb.from('google_links').select('token_enc').eq('teacher_id', a.teacher_id).maybeSingle();
    if (link?.token_enc) {
      try {
        const student = people.filter((p) => p.role === 'student').map((p) => p.email).filter(Boolean) as string[];
        const ev = await createMeetEvent(link.token_enc, {
          title: `${lessonTitle(a)} · Languago`,
          description: a.note ? `Öğrencinin notu: ${a.note}` : 'Languago üzerinden planlanan ders.',
          startsAt: a.starts_at, endsAt: a.ends_at, attendees: student,
        });
        await sb.from('appointments').update({ meet_url: ev.meetUrl, calendar_event_id: ev.eventId }).eq('id', a.id);
        a.meet_url = ev.meetUrl; a.calendar_event_id = ev.eventId;
        return { url: ev.meetUrl, via: 'google' };
      } catch (e) {
        console.warn('[lessons] google event failed:', e instanceof Error ? e.message : String(e));
        // An expired or revoked connection is removed so the page asks to reconnect.
        if (e instanceof Error && /invalid_grant|token_unreadable|UNAUTHENTICATED/.test(e.message)) {
          await sb.from('google_links').delete().eq('teacher_id', a.teacher_id);
        }
      }
    }
  }
  const { data: s } = await sb.from('teacher_settings').select('meet_link').eq('teacher_id', a.teacher_id).maybeSingle();
  if (s?.meet_link) {
    await sb.from('appointments').update({ meet_url: s.meet_link }).eq('id', a.id);
    a.meet_url = s.meet_link;
    return { url: s.meet_link, via: 'own' };
  }
  return { url: joinUrl(a), via: 'room' };
}

/** Remove a cancelled lesson's Google event (invitees get Google's notice). */
export async function dropMeet(sb: Sb, a: Appt): Promise<void> {
  if (!a.calendar_event_id || !googleReady()) return;
  try {
    const { data: sealed } = await sb.rpc('lesson_google_token', { p_id: a.id });
    if (typeof sealed === 'string' && sealed) await deleteEvent(sealed, a.calendar_event_id);
  } catch (e) {
    console.warn('[lessons] google delete failed:', e instanceof Error ? e.message : String(e));
  }
}

const abs = (origin: string, url: string) => (url.startsWith('/') ? origin + url : url);

/** The emails around a lesson. `event` says what just happened. */
export async function mailLesson(
  event: 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'added' | 'instant',
  a: Appt, people: Person[], origin: string, actorId?: string,
): Promise<void> {
  const teacher = people.find((p) => p.role === 'teacher');
  const students = people.filter((p) => p.role === 'student');
  const when = whenLabel(a.starts_at);
  const title = lessonTitle(a);
  const join = abs(origin, joinUrl(a));
  const cal = { href: googleCalendarLink(`${title} · Languago`, a.starts_at, a.ends_at, `Derse katıl: ${join}`), label: 'Google Takvim’e ekle' };
  const emails = (list: Person[]) => list.map((p) => p.email).filter(Boolean) as string[];

  if (event === 'requested' && teacher?.email) {
    const s = students[0];
    await sendEmail([teacher.email], `Yeni ders isteği: ${nameOf(s)}, ${when}`, mailLayout('Yeni ders isteği', [
      `${nameOf(s)}, ${when} için sizden ders istedi.`,
      ...(a.note ? [`Notu: “${a.note}”`] : []),
      'İsteği onaylayana kadar bu saat takviminizde ayrılmış görünür; onaylamazsanız ders yapılmaz.',
    ], { href: `${origin}/app/takvim`, label: 'İsteği yanıtla' }));
  }
  if (event === 'confirmed') {
    await sendEmail(emails(students), `Dersiniz onaylandı: ${when}`, mailLayout('Dersiniz onaylandı', [
      `${nameOf(teacher)} ile ${when} dersiniz kesinleşti.`,
      'Ders saatinde aşağıdaki bağlantıdan katılın.',
    ], { href: join, label: 'Derse katıl' }, cal));
  }
  if (event === 'declined') {
    await sendEmail(emails(students), `Ders isteğiniz: ${when}`, mailLayout('Bu saat uygun değil', [
      `${nameOf(teacher)}, ${when} için isteğinizi kabul edemedi.`,
      'Takvimden başka bir saat seçebilirsiniz.',
    ], { href: `${origin}/app/derslerim`, label: 'Başka saat seç' }));
  }
  if (event === 'cancelled') {
    const byTeacher = actorId === a.teacher_id;
    const to = byTeacher ? emails(students) : teacher?.email ? [teacher.email] : [];
    const who = byTeacher ? nameOf(teacher) : nameOf(students[0]);
    await sendEmail(to, `Ders iptal edildi: ${when}`, mailLayout('Ders iptal edildi', [
      `${who}, ${when} dersini iptal etti.`,
    ], { href: `${origin}${byTeacher ? '/app/derslerim' : '/app/takvim'}`, label: 'Takvimi aç' }));
  }
  if (event === 'added') {
    await sendEmail(emails(students), `Yeni ders: ${when}`, mailLayout('Takviminize ders eklendi', [
      `${nameOf(teacher)}, ${when} için bir ders planladı: ${title}.`,
      'Ders saatinde aşağıdaki bağlantıdan katılın.',
    ], { href: join, label: 'Derse katıl' }, cal));
  }
  if (event === 'instant') {
    await sendEmail(emails(students), `Ders şimdi başlıyor: ${nameOf(teacher)}`, mailLayout('Ders şimdi başlıyor', [
      `${nameOf(teacher)} sizi şu an başlayan canlı derse çağırıyor.`,
    ], { href: join, label: 'Hemen katıl' }));
  }
}

/** In-app notice for the students of a lesson a teacher added or started now. */
export async function noticeStudents(sb: Sb, a: Appt, instant: boolean): Promise<void> {
  try { await sb.rpc('notify_lesson_students', { p_id: a.id, p_instant: instant }); } catch { /* the email still goes */ }
}

/** Signed-in user, their role and a Supabase client for an API route. */
export async function apiUser(ctx: { request: Request; cookies: any }): Promise<
  { sb: any; userId: string; email: string; role: string } | Response
> {
  const { createSupabaseClient, pageCookieSource } = await import('./supabase');
  const sb = createSupabaseClient(pageCookieSource(ctx));
  if (!sb) return json(503, { ok: false, error: 'Servis şu anda kullanılamıyor.' });
  const { data } = await sb.auth.getUser();
  if (!data.user) return json(401, { ok: false, error: 'Lütfen yeniden giriş yapın.' });
  const { data: prof } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { sb, userId: data.user.id, email: data.user.email || '', role: String(prof?.role || 'student') };
}
export const isTeacherRole = (r: string) => r === 'teacher' || r === 'admin';

/** Parse "student:<uuid>" / "class:<uuid>". */
export function parseTarget(raw: unknown): { student_id: string | null; class_id: string | null } | null {
  const m = /^(student|class):([0-9a-f-]{36})$/i.exec(String(raw || ''));
  if (!m) return null;
  return m[1] === 'student' ? { student_id: m[2], class_id: null } : { student_id: null, class_id: m[2] };
}
