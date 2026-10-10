// Owner notifications by email (Resend). Quietly does nothing until the
// owner has set RESEND_API_KEY, EMAIL_FROM and ADMIN_NOTIFY_EMAIL in Vercel;
// the notify address lives only in the environment, never in this public repo.

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/** Tell the owner a new teacher account exists. Never throws. */
export async function notifyNewTeacher(info: { email: string; name?: string | null; via: 'email' | 'google' }): Promise<void> {
  const key = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.EMAIL_FROM;
  const to = import.meta.env.ADMIN_NOTIFY_EMAIL;
  if (!key || !from || !to) return;
  const name = (info.name || '').trim();
  const when = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#10201e">
    <h2 style="margin:0 0 12px">Yeni öğretmen kaydı</h2>
    <p style="margin:0 0 6px"><b>Ad:</b> ${esc(name || '(girilmedi)')}</p>
    <p style="margin:0 0 6px"><b>E-posta:</b> ${esc(info.email)}</p>
    <p style="margin:0 0 6px"><b>Kayıt yolu:</b> ${info.via === 'google' ? 'Google' : 'E-posta formu'}</p>
    <p style="margin:0 0 16px"><b>Zaman:</b> ${esc(when)}</p>
    <p style="margin:0;color:#64746f">Öğretmen hesabı hemen açıldı. Languago</p>
  </div>`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: `Yeni öğretmen: ${name || info.email}`, html }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
  } catch (e) {
    console.warn('[notify] teacher email failed:', e instanceof Error ? e.message : String(e));
  }
}
