// Homework ("Ödev"): a teacher's material sent to a class or one student.
// Scoring and the answer key live in the database (get_assignment /
// submit_assignment); these helpers only load lists for the pages.

export type TargetClass = { id: string; name: string; members: { id: string; name: string }[] };

/** The teacher's classes with their students, for the "Ödev ver" form and the results tables. */
export async function teacherClasses(sb: any, teacherId: string): Promise<TargetClass[]> {
  const [cr, rm, st] = await Promise.all([
    sb.from('class_roster').select('id, class_name').eq('teacher_id', teacherId).order('created_at'),
    sb.from('roster_members').select('class_id, student_id'),
    sb.rpc('get_teacher_students', { p_teacher: teacherId }),
  ]);
  const names = new Map(((st.data as any[]) || []).map((s) => [s.student_id, s.full_name || (s.email || '').split('@')[0] || 'Öğrenci']));
  return ((cr.data as any[]) || []).map((c) => ({
    id: c.id,
    name: c.class_name,
    members: ((rm.data as any[]) || []).filter((m) => m.class_id === c.id).map((m) => ({ id: m.student_id, name: names.get(m.student_id) || 'Öğrenci' })),
  }));
}

export const dueLabel = (d: string | null) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }) : null;

/** Today in Istanbul as YYYY-MM-DD (for "late" and the date picker's minimum). */
export const todayTR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
