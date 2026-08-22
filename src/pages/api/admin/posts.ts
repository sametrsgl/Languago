import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeAdmin } from '../../../lib/admin';

type Respond = (status: number, body: Record<string, unknown>) => Response;
const respond: Respond = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Admin CMS — blog_posts management.
 * All writes validate role === 'admin' server-side from profiles.role.
 * RLS policies additionally require role='admin' for any write/delete to
 * public.blog_posts.
 *
 *  GET    /api/admin/posts                    -> { ok, posts: [...] }
 *  POST   /api/admin/posts  { id?, title, slug?, summary?, body?, cover_url?, published?, author? }
 *            create (no id) or update (with id) -> { ok, post }
 *  DELETE /api/admin/posts  { id }            delete -> { ok }
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, summary, body, cover_url, published, author, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return respond(500, { ok: false, error: { message: error.message } });
  return respond(200, { ok: true, posts: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : null;
  const title = (typeof body.title === 'string' ? body.title : '').trim();
  const summary = (typeof body.summary === 'string' ? body.summary : '').trim();
  const content = typeof body.body === 'string' ? body.body : '';
  const coverUrl = (typeof body.cover_url === 'string' ? body.cover_url : '').trim();
  const author = (typeof body.author === 'string' ? body.author : '').trim();

  if (!title) {
    return respond(400, { ok: false, error: { fields: { title: ['Başlık gerekli.'] } } });
  }

  // Slug auto-generates from title when absent; unique enforced by DB.
  let slug = (typeof body.slug === 'string' ? body.slug : '').trim();
  if (!slug) slug = slugify(title);
  if (!slug) {
    return respond(400, { ok: false, error: { fields: { slug: ['Geçerli bir slug oluşturulamadı.'] } } });
  }

  const published = body.published === true || body.published === 'true';

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const now = new Date().toISOString();
  const payload = {
    title,
    slug,
    summary: summary || null,
    body: content || null,
    cover_url: coverUrl || null,
    published,
    author: author || null,
    updated_at: now,
  };

  let data;
  let error;
  if (id) {
    ({ data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select('id, slug, title, summary, body, cover_url, published, author, created_at, updated_at')
      .single());
  } else {
    ({ data, error } = await supabase
      .from('blog_posts')
      .insert({ ...payload, created_at: now })
      .select('id, slug, title, summary, body, cover_url, published, author, created_at, updated_at')
      .single());
  }

  if (error || !data) {
    const message =
      error?.code === '23505'
        ? 'Bu slug kullanımda. Lütfen farklı bir slug seçin.'
        : error?.message ?? 'Kayıt başarısız.';
    return respond(500, { ok: false, error: { message } });
  }
  return respond(200, { ok: true, post: data });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  let body: { id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) return respond(400, { ok: false, error: { message: 'Geçersiz kayıt.' } });

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return respond(500, { ok: false, error: { message: error.message } });
  return respond(200, { ok: true });
};