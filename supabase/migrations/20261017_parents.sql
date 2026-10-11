-- Languago 2.0: parent accounts, linked only with the child's code.
--
-- Security fix: the old flow let ANY signed-in account link itself to ANY
-- student by e-mail (get_child_by_email + an open insert policy) and then
-- read that student's progress. (Checked 2026-10-11: no links existed.)
-- Now a student creates a short-lived parent code; a parent enters it.

revoke execute on function public.get_child_by_email(uuid, text) from authenticated;
drop policy if exists "family_parent_all" on public.family_links;
create policy "family_parent_read"   on public.family_links for select using (auth.uid() = parent_id or auth.uid() = child_id);
create policy "family_either_delete" on public.family_links for delete using (auth.uid() = parent_id or auth.uid() = child_id);

-- Sign-up can now choose "Veliyim" too.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name) values (new.id,
    case new.raw_user_meta_data->>'role_choice' when 'teacher' then 'teacher' when 'parent' then 'parent' else 'student' end,
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), 120), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.parent_codes (
  code        text primary key,
  child_id    uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null
);
alter table public.parent_codes enable row level security;
create policy "pc_child_read" on public.parent_codes for select using (auth.uid() = child_id);

-- A student makes (or renews) their parent code: 6 characters, 7 days.
create or replace function public.make_parent_code()
returns text language plpgsql security definer set search_path = public as $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  delete from public.parent_codes where child_id = auth.uid() or expires_at < now();
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    begin
      insert into public.parent_codes (code, child_id, expires_at) values (c, auth.uid(), now() + interval '7 days');
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  return c;
end;
$$;

-- A parent links a child with the child's code (the code is used up).
create or replace function public.link_child(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare pc record; who text;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if (select role from public.profiles where id = auth.uid()) <> 'parent' then raise exception 'not_parent'; end if;
  select * into pc from public.parent_codes where code = upper(trim(p_code)) and expires_at > now();
  if pc.code is null then raise exception 'bad_code'; end if;
  if pc.child_id = auth.uid() then raise exception 'bad_code'; end if;
  insert into public.family_links (parent_id, child_id) values (auth.uid(), pc.child_id) on conflict do nothing;
  delete from public.parent_codes where code = pc.code;
  select coalesce(full_name, 'Öğrenci') into who from public.profiles where id = pc.child_id;
  insert into public.notifications (user_id, title, body, href, kind)
  values (pc.child_id, 'Veli hesabı bağlandı', 'Bir veli hesabı ilerlemenizi görebilir. İstemiyorsanız Hesabım sayfasından kaldırabilirsiniz.', '/app/hesap', 'info');
  return who;
end;
$$;

-- What a linked parent sees about a child (read-only summary).
create or replace function public.child_overview(p_child uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not exists (select 1 from public.family_links where parent_id = auth.uid() and child_id = p_child) then return null; end if;
  select jsonb_build_object(
    'name', (select full_name from public.profiles where id = p_child),
    'test', (select payload - 'answers' from public.student_progress where student_id = p_child and module = 'placement-test'),
    'path', (select to_jsonb(ps) - 'student_id' from public.path_state ps where ps.student_id = p_child),
    'recent', coalesce((select jsonb_agg(x) from (select day, task, best_score, passed, updated_at from public.mission_results where student_id = p_child order by updated_at desc limit 15) x), '[]'::jsonb),
    'lessons', coalesce((select jsonb_agg(x) from (select starts_at, status, attendance, report from public.appointments where student_id = p_child and starts_at > now() - interval '60 days' order by starts_at desc limit 12) x), '[]'::jsonb),
    'exams', coalesce((select jsonb_agg(x) from (select level, score, passed, taken_at from public.level_exams where student_id = p_child order by taken_at desc) x), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;

create or replace function public.my_children()
returns table (child_id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select f.child_id, coalesce(p.full_name, 'Öğrenci') from public.family_links f join public.profiles p on p.id = f.child_id where f.parent_id = auth.uid();
$$;

create or replace function public.my_parents()
returns table (parent_id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select f.parent_id, coalesce(p.full_name, 'Veli') from public.family_links f join public.profiles p on p.id = f.parent_id where f.child_id = auth.uid();
$$;

revoke all on function public.make_parent_code() from public;
revoke all on function public.link_child(text) from public;
revoke all on function public.child_overview(uuid) from public;
revoke all on function public.my_children() from public;
revoke all on function public.my_parents() from public;
grant execute on function public.make_parent_code() to authenticated;
grant execute on function public.link_child(text) to authenticated;
grant execute on function public.child_overview(uuid) to authenticated;
grant execute on function public.my_children() to authenticated;
grant execute on function public.my_parents() to authenticated;

-- Google sign-up as a parent (like claim_teacher_role): only a brand-new account.
create or replace function public.claim_parent_role()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = 'parent'
  where id = auth.uid() and role = 'student' and created_at > now() - interval '15 minutes';
end;
$$;
revoke all on function public.claim_parent_role() from public;
grant execute on function public.claim_parent_role() to authenticated;
