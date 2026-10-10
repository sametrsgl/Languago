-- Languago 2.0: the sign-up page asks "Öğrenciyim / Öğretmenim".
-- Applied to production on 2026-10-11 (SQL editor, approved by the owner).

-- 1) New accounts get the role chosen on the sign-up page (student or
--    teacher; teachers get instant access, owner's decision) and their name.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role_choice' = 'teacher' then 'teacher' else 'student' end,
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2) Google sign-up as a teacher: the OAuth callback calls this right after
--    the account is created; only an account under 15 minutes old can switch
--    itself from student to teacher.
create or replace function public.claim_teacher_role()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = 'teacher'
  where id = auth.uid() and role = 'student' and created_at > now() - interval '15 minutes';
end;
$$;
revoke all on function public.claim_teacher_role() from public;
grant execute on function public.claim_teacher_role() to authenticated;
