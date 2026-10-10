// Timetable helpers shared by the teacher calendar, the student booking page
// and the API. Pure functions only (tests import this file directly).
// Turkey has used UTC+3 all year since 2016, so local time is a fixed offset.

export const TZ = 'Europe/Istanbul';
const OFFSET_MIN = 180;
const MIN = 60_000;
const DAY = 86_400_000;

export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const LESSON_LENGTHS = [30, 45, 60, 90];

export type Hours = { weekday: number; startMin: number; endMin: number };
export type Range = { startsAt: string; endsAt: string };
export type Settings = { lessonMin: number; noticeHours: number; windowDays: number };
export const DEFAULT_SETTINGS: Settings = { lessonMin: 45, noticeHours: 12, windowDays: 21 };

/** Turkey-local parts of an instant: day number since epoch, weekday (0 = Monday), minute of day. */
export function localParts(ms: number): { day: number; weekday: number; minute: number } {
  const local = ms + OFFSET_MIN * MIN;
  const day = Math.floor(local / DAY);
  const minute = Math.floor((local - day * DAY) / MIN);
  // 1970-01-01 was a Thursday (weekday 3 when Monday is 0).
  return { day, weekday: (day + 3) % 7, minute };
}

/** The UTC instant of a Turkey-local day number and minute. */
export function fromLocal(day: number, minute: number): number {
  return day * DAY + (minute - OFFSET_MIN) * MIN;
}

/** Turkey-local day number of the Monday of the week containing `ms`. */
export function mondayOf(ms: number): number {
  const p = localParts(ms);
  return p.day - p.weekday;
}

/** "18:30" -> 1110; null when not a valid time. */
export function parseHm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return null;
  return h * 60 + mi;
}
export function hm(minute: number): string {
  const h = Math.floor(minute / 60), m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Clean up weekly hours: valid rows only, sorted, overlaps merged. */
export function normalizeHours(rows: Hours[]): Hours[] {
  const ok = rows
    .filter((r) => Number.isInteger(r.weekday) && r.weekday >= 0 && r.weekday <= 6
      && Number.isInteger(r.startMin) && Number.isInteger(r.endMin)
      && r.startMin >= 0 && r.endMin <= 1440 && r.endMin > r.startMin)
    .sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin);
  const out: Hours[] = [];
  for (const r of ok) {
    const last = out[out.length - 1];
    if (last && last.weekday === r.weekday && r.startMin <= last.endMin) last.endMin = Math.max(last.endMin, r.endMin);
    else out.push({ ...r });
  }
  return out;
}

/**
 * Free lesson slots between now + notice and now + window. A slot starts on
 * the lesson-length grid inside a weekly-hours row and must not touch any
 * busy range (lessons, requests, closed periods). Same rules as the
 * request_lesson function in the database.
 */
export function freeSlots(hours: Hours[], busy: Range[], settings: Settings, nowMs: number): Range[] {
  const len = settings.lessonMin;
  const earliest = nowMs + settings.noticeHours * 3_600_000;
  const latest = nowMs + settings.windowDays * DAY;
  const busyMs = busy.map((b) => [Date.parse(b.startsAt), Date.parse(b.endsAt)] as const);
  const out: Range[] = [];
  const first = localParts(nowMs).day;
  const last = localParts(latest).day;
  for (let day = first; day <= last; day++) {
    const weekday = (day + 3) % 7;
    for (const h of hours) {
      if (h.weekday !== weekday) continue;
      for (let m = h.startMin; m + len <= h.endMin; m += len) {
        const s = fromLocal(day, m), e = s + len * MIN;
        if (s < earliest || s > latest) continue;
        if (busyMs.some(([bs, be]) => bs < e && be > s)) continue;
        out.push({ startsAt: new Date(s).toISOString(), endsAt: new Date(e).toISOString() });
      }
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Group ranges by Turkey-local day number, keeping order. */
export function byDay<T extends { startsAt: string }>(items: T[]): { day: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const d = localParts(Date.parse(it.startsAt)).day;
    const list = map.get(d);
    if (list) list.push(it); else map.set(d, [it]);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([day, items]) => ({ day, items }));
}

const dayFmt = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'short' });
export function dayLabel(day: number, todayDay: number): string {
  if (day === todayDay) return 'Bugün';
  if (day === todayDay + 1) return 'Yarın';
  return dayFmt.format(new Date(fromLocal(day, 12 * 60)));
}
export function shortDay(day: number): string {
  return shortFmt.format(new Date(fromLocal(day, 12 * 60)));
}
export function timeOf(iso: string): string {
  return hm(localParts(Date.parse(iso)).minute);
}
/** "Salı 14 Ekim, 18:30" */
export function whenLabel(iso: string, nowMs = Date.now()): string {
  const p = localParts(Date.parse(iso));
  return `${dayLabel(p.day, localParts(nowMs).day)}, ${hm(p.minute)}`;
}

export const STATUS_LABEL: Record<string, string> = {
  requested: 'Onay bekliyor',
  confirmed: 'Onaylandı',
  declined: 'Kabul edilmedi',
  cancelled: 'İptal edildi',
  expired: 'Yanıtlanmadı',
};

/** "Add to Google Calendar" link (no API, opens the user's own calendar). */
export function googleCalendarLink(title: string, startsAt: string, endsAt: string, details: string): string {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${f(startsAt)}/${f(endsAt)}`, details });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Where a lesson is held: its Meet link, else the Languago room. */
export function joinUrl(a: { meet_url?: string | null; room_token: string }): string {
  return a.meet_url || `/ders/${a.room_token}`;
}

/** Turkish message for an error code raised by the database functions. */
export function lessonError(raw: string | undefined): string {
  const code = String(raw || '');
  const map: Record<string, string> = {
    signed_out: 'Lütfen yeniden giriş yapın.',
    not_your_teacher: 'Bu öğretmenin sınıfında değilsiniz.',
    too_soon: 'Bu saat çok yakın. Daha ileri bir saat seçin.',
    too_far: 'Bu kadar ileri bir tarih için henüz ders alınamıyor.',
    not_open: 'Öğretmen bu saatte ders vermiyor.',
    slot_taken: 'Bu saat az önce doldu. Başka bir saat seçin.',
    too_many: 'Yanıt bekleyen 3 isteğiniz var. Öğretmeniniz yanıtlayınca yeni istek gönderebilirsiniz.',
    not_found: 'Ders bulunamadı.',
    already_decided: 'Bu istek zaten yanıtlanmış.',
    already_closed: 'Bu ders zaten kapanmış.',
    too_late: 'Ders başladığı için bu işlem yapılamaz.',
    bad_code: 'Bu sınıf kodu bulunamadı. Kodu öğretmeninize sorun.',
    own_class: 'Bu sizin kendi sınıfınız.',
  };
  for (const k of Object.keys(map)) if (code.includes(k)) return map[k];
  if (code.includes('appointments_no_overlap')) return 'Bu saatte başka bir dersiniz var.';
  return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
}
