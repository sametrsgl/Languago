-- ============================================================================
-- Languago — Q16: ADMIN CMS (marketing copy, global assets, blog posts)
-- ============================================================================
-- Lets an admin manage marketing text, update global platform assets, and
-- publish educational blog posts without code deploys. Content is read by
-- anyone (public pages), written only by the admin role.
--
-- Tables: site_settings (key/value marketing + asset strings),
--         blog_posts (published SEO content).
-- ============================================================================

create table public.site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  summary     text,
  body        text not null,                 -- markdown-ish content
  cover_url   text,
  published   boolean not null default false,
  author      text,                         -- display name
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.blog_posts enable row level security;

-- Anyone can read published content + settings (public marketing surface).
create policy "settings_read_public" on public.site_settings for select to anon, authenticated using (true);
create policy "blog_read_published"  on public.blog_posts     for select to anon, authenticated using (published = true);
-- Admin (role='admin' in profiles) may write/update everything.
create policy "settings_admin_write" on public.site_settings for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "settings_admin_update" on public.site_settings for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "settings_admin_delete" on public.site_settings for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- Blog: admins full CRUD on all rows (including drafts), readers only published.
create policy "blog_admin_all" on public.blog_posts for all to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- updated_at
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute procedure public.set_updated_at();
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute procedure public.set_updated_at();