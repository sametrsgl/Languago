import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localParts, fromLocal, mondayOf, parseHm, hm, normalizeHours, freeSlots, byDay, googleCalendarLink, lessonError, DEFAULT_SETTINGS } from '../src/lib/timetable.ts';

// Monday 12 October 2026, 09:00 in Turkey = 06:00 UTC.
const MON_9 = Date.parse('2026-10-12T06:00:00Z');

test('local parts use Turkey time and Monday-first weekdays', () => {
  const p = localParts(MON_9);
  assert.equal(p.weekday, 0);
  assert.equal(p.minute, 9 * 60);
  assert.equal(new Date(fromLocal(p.day, 18 * 60)).toISOString(), '2026-10-12T15:00:00.000Z');
  // 23:30 UTC on Sunday is already Monday 02:30 in Turkey.
  assert.equal(localParts(Date.parse('2026-10-11T23:30:00Z')).weekday, 0);
  assert.equal(mondayOf(Date.parse('2026-10-17T12:00:00Z')), p.day);
});

test('times parse and print', () => {
  assert.equal(parseHm('18:30'), 1110);
  assert.equal(parseHm('24:00'), 1440);
  assert.equal(parseHm('25:00'), null);
  assert.equal(parseHm('9'), null);
  assert.equal(hm(1110), '18:30');
});

test('weekly hours are cleaned and merged', () => {
  const h = normalizeHours([
    { weekday: 2, startMin: 600, endMin: 720 },
    { weekday: 0, startMin: 1080, endMin: 1200 },
    { weekday: 0, startMin: 1140, endMin: 1260 },
    { weekday: 7, startMin: 0, endMin: 60 },
    { weekday: 1, startMin: 600, endMin: 600 },
  ]);
  assert.deepEqual(h, [{ weekday: 0, startMin: 1080, endMin: 1260 }, { weekday: 2, startMin: 600, endMin: 720 }]);
});

test('free slots follow hours, grid, notice, window and busy times', () => {
  const hours = [{ weekday: 0, startMin: 18 * 60, endMin: 20 * 60 }]; // Mondays 18:00-20:00
  const settings = { ...DEFAULT_SETTINGS, lessonMin: 45, noticeHours: 12, windowDays: 15 };
  const busy = [{ startsAt: '2026-10-19T15:45:00Z', endsAt: '2026-10-19T16:30:00Z' }]; // next Monday 18:45
  const slots = freeSlots(hours, busy, settings, MON_9);
  const times = slots.map((s) => s.startsAt);
  // Today 18:00 is only 9 h away (notice 12 h): skipped. 45-min grid fits 18:00 and 18:45.
  assert.ok(!times.includes('2026-10-12T15:00:00.000Z'));
  assert.ok(times.includes('2026-10-19T15:00:00.000Z'));
  assert.ok(!times.includes('2026-10-19T15:45:00.000Z'), 'busy slot hidden');
  assert.ok(times.includes('2026-10-26T15:45:00.000Z'));
  assert.equal(times.length, 3);
  for (const s of slots) assert.equal(Date.parse(s.endsAt) - Date.parse(s.startsAt), 45 * 60_000);
});

test('slots group by local day', () => {
  const g = byDay([{ startsAt: '2026-10-20T15:00:00Z' }, { startsAt: '2026-10-20T20:59:00Z' }, { startsAt: '2026-10-20T21:00:00Z' }]);
  assert.equal(g.length, 2); // 21:00 UTC is 00:00 the next day in Turkey
  assert.equal(g[0].items.length, 2);
});

test('calendar link and error messages', () => {
  const url = googleCalendarLink('İngilizce dersi', '2026-10-20T15:00:00.000Z', '2026-10-20T15:45:00.000Z', 'x');
  assert.match(url, /dates=20261020T150000Z%2F20261020T154500Z/);
  assert.match(lessonError('ERROR: slot_taken'), /doldu/);
  assert.match(lessonError('conflicting key value violates exclusion constraint "appointments_no_overlap"'), /başka bir ders/);
});

test('database rules match the page rules', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261012_timetable.sql', import.meta.url), 'utf8');
  assert.match(sql, /\(m0 - h\.start_min\) % s\.lesson_min = 0/, 'request_lesson uses the same lesson-length grid');
  assert.match(sql, /at time zone 'Europe\/Istanbul'/);
  assert.match(sql, /exclude using gist/, 'no double booking');
  assert.match(sql, /grant execute on function public\.claim_lesson_reminders\(\) to service_role/);
  assert.doesNotMatch(sql, /claim_lesson_reminders\(\) to authenticated/);
  assert.match(sql, /drop policy if exists "roster_member_join"/, 'joining a class needs the code');
});
