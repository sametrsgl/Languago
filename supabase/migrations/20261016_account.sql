-- Languago 2.0: account page (KVKK): learners and teachers can delete their
-- own account and everything linked to it. Consents for AI feedback and
-- speech recognition are kept with a timestamp.

create table if not exists public.consents (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  ai_feedback boolean not null default false,
  speech      boolean not null default false,
  updated_at  timestamptz not null default now()
);
alter table public.consents enable row level security;
create policy "consent_own_all" on public.consents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Delete the caller's account. Rows in other tables go with it (on delete
-- cascade from profiles / auth.users). Returns false if something blocks it.
create or replace function public.delete_my_account()
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'signed_out'; end if;
  -- a teacher's classes and old-style lessons are removed with them
  delete from public.lessons where teacher_id = me;
  delete from public.class_roster where teacher_id = me;
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
  return true;
exception when foreign_key_violation then
  return false;
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
