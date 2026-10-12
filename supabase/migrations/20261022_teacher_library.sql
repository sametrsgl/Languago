-- Languago 2.0: the teacher's own library ("Materyallerim"). A teacher files
-- Applied to production on 2026-10-12 (SQL editor, approved by the owner).
-- an AI material under a section (a level such as B1, or an exam such as
-- IELTS) and a topic heading. Headings are the built-in ones (in the app's
-- code) or the teacher's own, stored here.

create table if not exists public.teacher_topics (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  track       text not null check (track in ('A1','A2','B1','B2','C1','C2','IELTS','TOEFL','PTE','YDS','YOKDIL','YDT','LGS')),
  title       text not null check (length(title) between 2 and 80),
  created_at  timestamptz not null default now()
);
create unique index if not exists teacher_topics_unique on public.teacher_topics (teacher_id, track, lower(title));
alter table public.teacher_topics enable row level security;
create policy "tt_own_read"   on public.teacher_topics for select using (auth.uid() = teacher_id);
create policy "tt_own_delete" on public.teacher_topics for delete using (auth.uid() = teacher_id);

-- where a material is filed; null track = not in the library yet
alter table public.teacher_materials add column if not exists track text
  check (track is null or track in ('A1','A2','B1','B2','C1','C2','IELTS','TOEFL','PTE','YDS','YOKDIL','YDT','LGS'));
alter table public.teacher_materials add column if not exists topic text check (topic is null or length(topic) between 2 and 80);
alter table public.teacher_materials add column if not exists filed_at timestamptz;

-- Add one of your own topic headings (teachers only, at most 300 each).
create or replace function public.add_teacher_topic(p_track text, p_title text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; t text := btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g'));
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin')) then raise exception 'not_teacher'; end if;
  if (select count(*) from public.teacher_topics where teacher_id = auth.uid()) >= 300 then raise exception 'too_many'; end if;
  insert into public.teacher_topics (teacher_id, track, title) values (auth.uid(), p_track, left(t, 80))
  on conflict (teacher_id, track, lower(title)) do update set title = excluded.title
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_teacher_topic(text, text) from public;
grant execute on function public.add_teacher_topic(text, text) to authenticated;
revoke execute on function public.add_teacher_topic(text, text) from anon;

-- File one of your own materials under a section and heading (null track = take it out).
create or replace function public.file_teacher_material(p_id uuid, p_track text, p_topic text)
returns boolean language plpgsql security definer set search_path = public as $$
declare t text := nullif(btrim(regexp_replace(coalesce(p_topic, ''), '\s+', ' ', 'g')), '');
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  update public.teacher_materials
     set track = p_track, topic = case when p_track is null then null else left(t, 80) end,
         filed_at = case when p_track is null then null else now() end
   where id = p_id and teacher_id = auth.uid();
  return found;
end;
$$;
revoke all on function public.file_teacher_material(uuid, text, text) from public;
grant execute on function public.file_teacher_material(uuid, text, text) to authenticated;
revoke execute on function public.file_teacher_material(uuid, text, text) from anon;
