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

/** Send one email through Resend. Never throws; false when not sent. */
export async function sendEmail(to: string[], subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.EMAIL_FROM;
  const list = to.filter((x) => typeof x === 'string' && x.includes('@'));
  if (!key || !from || !list.length) return false;
  try {
    // One email per person (batch) so students never see each other's addresses.
    const one = list.length === 1;
    const res = await fetch(one ? 'https://api.resend.com/emails' : 'https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(one ? { from, to: list, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) } : list.slice(0, 100).map((t) => ({ from, to: [t], subject, html }))),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch (e) {
    console.warn('[notify] email failed:', e instanceof Error ? e.message : String(e));
    return false;
  }
}

/** A short branded email: title, a few lines, an optional button. */
export function mailLayout(title: string, lines: string[], button?: { href: string; label: string }, extra?: { href: string; label: string }): string {
  const p = lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5">${esc(l)}</p>`).join('');
  const btn = button
    ? `<p style="margin:18px 0 8px"><a href="${esc(button.href)}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${esc(button.label)}</a></p>`
    : '';
  const ex = extra ? `<p style="margin:0 0 8px"><a href="${esc(extra.href)}" style="color:#0d9488">${esc(extra.label)}</a></p>` : '';
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#10201e;max-width:520px">
    <p style="margin:0 0 18px;font-weight:800;color:#0b3b3a;letter-spacing:-.01em">languago</p>
    <h2 style="margin:0 0 12px;font-size:20px">${esc(title)}</h2>${p}${btn}${ex}
    <p style="margin:22px 0 0;color:#64746f;font-size:13px">Bu e-postayı Languago'daki dersleriniz için aldınız.</p>
  </div>`;
}

export const CONTACT_TOPICS: Record<string, string> = {
  genel: 'Genel soru', hesap: 'Hesap ve giriş', ders: 'Dersler ve takvim', icerik: 'İçerik ve seviyeler',
  kurum: 'Okul / kurum iş birliği', premium: 'Premium fikirleri', kvkk: 'Kişisel veriler (KVKK)',
};

/** E-mail a contact-form message to the owner (reply goes to the sender). Never throws. */
export async function notifyContact(m: { id: number | null; name: string; email: string; topic: string; message: string; page?: string | null; userId?: string | null }): Promise<boolean> {
  const to = import.meta.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return false;
  const when = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#10201e">
    <h2 style="margin:0 0 12px">Yeni mesaj: ${esc(CONTACT_TOPICS[m.topic] || m.topic)}</h2>
    <p style="margin:0 0 6px"><b>Ad:</b> ${esc(m.name)}</p>
    <p style="margin:0 0 6px"><b>E-posta:</b> ${esc(m.email)}${m.userId ? ' (Languago hesabı var)' : ''}</p>
    <p style="margin:0 0 6px"><b>Zaman:</b> ${esc(when)}${m.page ? ' · ' + esc(m.page) : ''}</p>
    <div style="margin:14px 0;padding:14px;border-radius:10px;background:#f1f5f4;white-space:pre-wrap">${esc(m.message)}</div>
    <p style="margin:0;color:#64746f">Yanıtla düğmesi doğrudan gönderene yazar.${m.id ? ' Kayıt no: ' + m.id : ''}</p>
  </div>`;
  return sendEmail([to], `Languago iletişim: ${m.name}`, html, m.email);
}
