-- Languago 2.0: AI material generator ("Materyal üret"). A teacher asks for a
-- lesson (level + topic); the server checks the AI draft and saves it here, so
-- the teacher can open it again as slides or a printable worksheet.

create table if not exists public.teacher_materials (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  level       text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  title       text not null check (length(title) between 1 and 160),
  request     jsonb not null default '{}'::jsonb,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists teacher_materials_teacher_idx on public.teacher_materials (teacher_id, created_at desc);
alter table public.teacher_materials enable row level security;
create policy "tm_own_read"   on public.teacher_materials for select using (auth.uid() = teacher_id);
create policy "tm_own_delete" on public.teacher_materials for delete using (auth.uid() = teacher_id);

-- Save a checked draft. Teachers only; at most 20 a day each.
create or replace function public.save_teacher_material(p_level text, p_title text, p_request jsonb, p_data jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin')) then raise exception 'not_teacher'; end if;
  if (select count(*) from public.teacher_materials where teacher_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too_many';
  end if;
  if pg_column_size(p_data) > 60000 or pg_column_size(p_request) > 2000 then raise exception 'too_big'; end if;
  insert into public.teacher_materials (teacher_id, level, title, request, data)
  values (auth.uid(), p_level, left(p_title, 160), p_request, p_data)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.save_teacher_material(text, text, jsonb, jsonb) from public;
grant execute on function public.save_teacher_material(text, text, jsonb, jsonb) to authenticated;
