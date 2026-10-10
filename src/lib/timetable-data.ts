// Data for the timetable pages, read with the signed-in user's client (row
// rules apply). The dev-only demo gets sample data instead.
import { DEFAULT_SETTINGS, freeSlots, fromLocal, localParts, mondayOf, type Hours, type Range, type Settings } from './timetable';
import type { Appt } from './lessons-server';
import { APPT_COLS } from './lessons-server';

type Sb = any;
export type Option = { id: string; name: string };
export type Block = { id: string; startsAt: string; endsAt: string; note: string | null };
export type TeacherData = {
  settings: Settings & { meetLink: string | null };
  hours: Hours[];
  blocks: Block[];
  week: Appt[];
  requests: Appt[];
  upcoming: Appt[];
  students: Option[];
  classes: (Option & { code: string })[];
  google: { email: string | null } | null;
  weekStartDay: number;
};
export type StudentData = {
  teachers: Option[];
  lessons: (Appt & { teacherName: string })[];
  slotsByTeacher: Record<string, Range[]>;
  settingsByTeacher: Record<string, Settings>;
};

const nameMap = (rows: Option[]) => new Map(rows.map((r) => [r.id, r.name]));
export function whoOf(a: Appt, students: Option[], classes: Option[]): string {
  if (a.student_id) return nameMap(students).get(a.student_id) || 'Öğrenci';
  if (a.class_id) return nameMap(classes).get(a.class_id) || 'Sınıf';
  return 'Açık ders';
}

export async function loadTeacher(sb: Sb, teacherId: string, weekOffset: number): Promise<TeacherData> {
  const now = Date.now();
  const weekStartDay = mondayOf(now) + weekOffset * 7;
  const from = new Date(fromLocal(weekStartDay, 0)).toISOString();
  const to = new Date(fromLocal(weekStartDay + 7, 0)).toISOString();
  const nowIso = new Date(now - 60 * 60_000).toISOString();
  const q = await Promise.all([
    sb.from('teacher_settings').select('lesson_min, notice_hours, window_days, meet_link').eq('teacher_id', teacherId).maybeSingle(),
    sb.from('teacher_hours').select('weekday, start_min, end_min').eq('teacher_id', teacherId),
    sb.from('teacher_blocks').select('id, starts_at, ends_at, note').eq('teacher_id', teacherId).gte('ends_at', new Date(now - 7 * 86_400_000).toISOString()).order('starts_at'),
    sb.from('appointments').select(APPT_COLS).eq('teacher_id', teacherId).in('status', ['requested', 'confirmed']).lt('starts_at', to).gt('ends_at', from).order('starts_at'),
    sb.from('appointments').select(APPT_COLS).eq('teacher_id', teacherId).eq('status', 'requested').gt('starts_at', new Date(now).toISOString()).order('starts_at'),
    sb.from('appointments').select(APPT_COLS).eq('teacher_id', teacherId).eq('status', 'confirmed').gt('ends_at', nowIso).order('starts_at').limit(8),
    sb.rpc('get_teacher_students', { p_teacher: teacherId }),
    sb.from('class_roster').select('id, class_name, join_code').eq('teacher_id', teacherId).order('created_at'),
    sb.from('google_links').select('google_email').eq('teacher_id', teacherId).maybeSingle(),
  ]).catch(() => [] as any[]);
  const [s, h, b, w, r, u, st, cl, g] = q.map((x: any) => x?.data ?? null);
  return {
    settings: s
      ? { lessonMin: s.lesson_min, noticeHours: s.notice_hours, windowDays: s.window_days, meetLink: s.meet_link }
      : { ...DEFAULT_SETTINGS, meetLink: null },
    hours: (h || []).map((x: any) => ({ weekday: x.weekday, startMin: x.start_min, endMin: x.end_min })),
    blocks: (b || []).map((x: any) => ({ id: x.id, startsAt: x.starts_at, endsAt: x.ends_at, note: x.note })),
    week: w || [],
    requests: r || [],
    upcoming: u || [],
    students: (st || []).map((x: any) => ({ id: x.student_id, name: x.full_name || (x.email || '').split('@')[0] || 'Öğrenci' })),
    classes: (cl || []).map((x: any) => ({ id: x.id, name: x.class_name, code: x.join_code })),
    google: g ? { email: g.google_email } : null,
    weekStartDay,
  };
}

export async function loadStudent(sb: Sb, userId: string): Promise<StudentData> {
  const now = Date.now();
  const { data: t } = await sb.rpc('my_teachers');
  const teachers: Option[] = (t || []).map((x: any) => ({ id: x.teacher_id, name: x.full_name }));
  const tName = nameMap(teachers);
  const { data: l } = await sb.from('appointments').select(APPT_COLS)
    .gt('ends_at', new Date(now - 14 * 86_400_000).toISOString()).order('starts_at').limit(40);
  const lessons = ((l || []) as Appt[]).map((a) => ({ ...a, teacherName: tName.get(a.teacher_id) || 'Öğretmen' }));
  const slotsByTeacher: Record<string, Range[]> = {};
  const settingsByTeacher: Record<string, Settings> = {};
  await Promise.all(teachers.map(async (te) => {
    const [s, h] = await Promise.all([
      sb.from('teacher_settings').select('lesson_min, notice_hours, window_days').eq('teacher_id', te.id).maybeSingle(),
      sb.from('teacher_hours').select('weekday, start_min, end_min').eq('teacher_id', te.id),
    ]);
    const settings: Settings = s.data
      ? { lessonMin: s.data.lesson_min, noticeHours: s.data.notice_hours, windowDays: s.data.window_days }
      : DEFAULT_SETTINGS;
    const hours = ((h.data || []) as any[]).map((x) => ({ weekday: x.weekday, startMin: x.start_min, endMin: x.end_min }));
    const { data: busy } = await sb.rpc('teacher_busy', {
      p_teacher: te.id, p_from: new Date(now).toISOString(), p_to: new Date(now + (settings.windowDays + 1) * 86_400_000).toISOString(),
    });
    settingsByTeacher[te.id] = settings;
    slotsByTeacher[te.id] = freeSlots(hours, ((busy || []) as any[]).map((x) => ({ startsAt: x.starts_at, endsAt: x.ends_at })), settings, now);
  }));
  void userId;
  return { teachers, lessons, slotsByTeacher, settingsByTeacher };
}

// --- dev-only demo -----------------------------------------------------------
const at = (day: number, h: number, m = 0) => new Date(fromLocal(day, h * 60 + m)).toISOString();
function demoAppt(id: string, start: string, min: number, extra: Partial<Appt>): Appt {
  return {
    id, teacher_id: 't', student_id: null, class_id: null, kind: 'one_on_one', title: null, starts_at: start,
    ends_at: new Date(Date.parse(start) + min * 60_000).toISOString(), status: 'confirmed', created_by: 'student',
    note: null, meet_url: 'https://meet.google.com/abc-defg-hij', calendar_event_id: null, room_token: 'demo' + id, ...extra,
  };
}
export function demoTeacher(weekOffset: number): TeacherData {
  const now = Date.now();
  const today = localParts(now).day;
  const mon = mondayOf(now) + weekOffset * 7;
  const students = [{ id: 's1', name: 'Elif Kaya' }, { id: 's2', name: 'Mert Demir' }, { id: 's3', name: 'Zeynep Arslan' }];
  const classes = [{ id: 'c1', name: '9-A Konuşma', code: 'K7M2PQ' }];
  const week = [
    demoAppt('a1', at(mon, 18), 45, { student_id: 's1' }),
    demoAppt('a2', at(mon + 2, 19, 30), 45, { student_id: 's2' }),
    demoAppt('a3', at(mon + 3, 16), 60, { class_id: 'c1', kind: 'group', title: '9-A Konuşma kulübü', created_by: 'teacher' }),
    demoAppt('a4', at(mon + 4, 18, 45), 45, { student_id: 's3', status: 'requested', meet_url: null, note: 'IELTS speaking part 2 çalışmak istiyorum.' }),
    demoAppt('a5', at(mon + 5, 11), 45, { student_id: 's1' }),
  ];
  const requests = [
    demoAppt('r1', at(today + 1, 18, 45), 45, { student_id: 's3', status: 'requested', meet_url: null, note: 'IELTS speaking part 2 çalışmak istiyorum.' }),
    demoAppt('r2', at(today + 3, 20, 15), 45, { student_id: 's2', status: 'requested', meet_url: null }),
  ];
  return {
    settings: { ...DEFAULT_SETTINGS, meetLink: null },
    hours: [0, 2, 4].map((wd) => ({ weekday: wd, startMin: 17 * 60, endMin: 21 * 60 })).concat([{ weekday: 3, startMin: 15 * 60, endMin: 18 * 60 }, { weekday: 5, startMin: 10 * 60, endMin: 13 * 60 }]),
    blocks: [{ id: 'b1', startsAt: at(mon + 6, 0), endsAt: at(mon + 7, 0), note: 'Aile ziyareti' }],
    week, requests, upcoming: week.filter((a) => a.status === 'confirmed' && Date.parse(a.ends_at) > now),
    students, classes, google: { email: 'ogretmen@gmail.com' }, weekStartDay: mon,
  };
}
export function demoStudent(): StudentData {
  const now = Date.now();
  const today = localParts(now).day;
  const teachers = [{ id: 't', name: 'Ayşe Yılmaz' }];
  const hours = [0, 1, 2, 3, 4].map((wd) => ({ weekday: wd, startMin: 17 * 60, endMin: 21 * 60 })).concat([{ weekday: 5, startMin: 10 * 60, endMin: 13 * 60 }]);
  const lessons = [
    { ...demoAppt('a1', at(today + 1, 18), 45, {}), teacherName: 'Ayşe Yılmaz' },
    { ...demoAppt('a2', at(today + 4, 19, 30), 45, { status: 'requested', meet_url: null }), teacherName: 'Ayşe Yılmaz' },
    { ...demoAppt('a0', at(today - 3, 18), 45, {}), teacherName: 'Ayşe Yılmaz' },
  ];
  const busy = lessons.map((l) => ({ startsAt: l.starts_at, endsAt: l.ends_at }));
  return { teachers, lessons, slotsByTeacher: { t: freeSlots(hours, busy, DEFAULT_SETTINGS, now) }, settingsByTeacher: { t: DEFAULT_SETTINGS } };
}
