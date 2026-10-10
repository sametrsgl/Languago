// Google Calendar for teachers: connect once, then each accepted lesson
// becomes an event in the teacher's calendar with a fresh Meet link and the
// student invited. Needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and
// GOOGLE_TOKEN_KEY (32 random bytes, base64) in Vercel; without them the
// "connect" card says Google is not set up yet and lessons use the fallbacks.
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';

export const GOOGLE_SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events';

function env() {
  return {
    id: import.meta.env.GOOGLE_CLIENT_ID as string | undefined,
    secret: import.meta.env.GOOGLE_CLIENT_SECRET as string | undefined,
    key: import.meta.env.GOOGLE_TOKEN_KEY as string | undefined,
  };
}

export function googleReady(): boolean {
  const e = env();
  return Boolean(e.id && e.secret && e.key && Buffer.from(e.key, 'base64').length === 32);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

export function consentUrl(origin: string, state: string, loginHint?: string): string {
  const q = new URLSearchParams({
    client_id: env().id || '',
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  if (loginHint) q.set('login_hint', loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

// --- token encryption (AES-256-GCM) -----------------------------------------
export function sealToken(plain: string): string {
  const key = Buffer.from(env().key || '', 'base64');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), body.toString('base64')].join('.');
}
export function openToken(sealed: string): string | null {
  try {
    const [v, iv, tag, body] = sealed.split('.');
    if (v !== 'v1') return null;
    const d = createDecipheriv('aes-256-gcm', Buffer.from(env().key || '', 'base64'), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(body, 'base64')), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

async function post(url: string, form: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data.error || res.status));
  return data;
}

/** Trade the consent code for tokens; returns the refresh token and the Google email. */
export async function exchangeCode(code: string, origin: string): Promise<{ refreshToken: string; email: string | null }> {
  const e = env();
  const data = await post('https://oauth2.googleapis.com/token', {
    code, client_id: e.id || '', client_secret: e.secret || '', redirect_uri: redirectUri(origin), grant_type: 'authorization_code',
  });
  if (!data.refresh_token) throw new Error('no_refresh_token');
  if (!String(data.scope || '').includes('calendar.events')) throw new Error('scope_missing');
  let email: string | null = null;
  try {
    // The id_token came straight from Google over TLS; only its email is read.
    const payload = JSON.parse(Buffer.from(String(data.id_token).split('.')[1], 'base64url').toString('utf8'));
    email = typeof payload.email === 'string' ? payload.email : null;
  } catch { /* email stays unknown */ }
  return { refreshToken: data.refresh_token, email };
}

async function accessToken(sealed: string): Promise<string> {
  const refresh = openToken(sealed);
  if (!refresh) throw new Error('token_unreadable');
  const e = env();
  const data = await post('https://oauth2.googleapis.com/token', {
    refresh_token: refresh, client_id: e.id || '', client_secret: e.secret || '', grant_type: 'refresh_token',
  });
  return data.access_token;
}

export async function revoke(sealed: string): Promise<void> {
  const refresh = openToken(sealed);
  if (!refresh) return;
  await post('https://oauth2.googleapis.com/revoke', { token: refresh }).catch(() => undefined);
}

/** Create a calendar event with a Meet link; returns the link and the event id. */
export async function createMeetEvent(sealed: string, ev: {
  title: string; description: string; startsAt: string; endsAt: string; attendees: string[];
}): Promise<{ meetUrl: string; eventId: string }> {
  const token = await accessToken(sealed);
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: ev.title,
      description: ev.description,
      start: { dateTime: ev.startsAt, timeZone: 'Europe/Istanbul' },
      end: { dateTime: ev.endsAt, timeZone: 'Europe/Istanbul' },
      attendees: ev.attendees.map((email) => ({ email })),
      conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: true },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data?.error?.status || res.status));
  const meetUrl = data.hangoutLink || data.conferenceData?.entryPoints?.find((p: any) => p.entryPointType === 'video')?.uri;
  if (!meetUrl) throw new Error('no_meet_link');
  return { meetUrl, eventId: data.id };
}

export async function deleteEvent(sealed: string, eventId: string): Promise<void> {
  const token = await accessToken(sealed);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
}
