-- Languago 2.0: KVKK for contact messages (see /kvkk, section 5).
-- Applied to production on 2026-10-12 (SQL editor, approved by the owner).
-- Messages are kept at most 1 year, deleted with the sender's account, and a
-- signed-in sender can read their own (so the data export includes them).

create policy "cm_own_read" on public.contact_messages for select using (auth.uid() = user_id);

-- Same as 20261019, plus: every new message clears messages older than a year.
create or replace function public.submit_contact(p_name text, p_email text, p_topic text, p_message text, p_page text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint; em text := lower(trim(p_email));
begin
  delete from public.contact_messages where created_at < now() - interval '1 year';
  if (select count(*) from public.contact_messages where email = em and created_at > now() - interval '1 day') >= 5
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 day') >= 300 then
    raise exception 'too_many';
  end if;
  insert into public.contact_messages (user_id, name, email, topic, message, page)
  values (auth.uid(), left(trim(p_name), 80), em, p_topic, left(trim(p_message), 3000), left(p_page, 200))
  returning id into new_id;
  return new_id;
end;
$$;

-- Same as 20261016, plus: the account's contact messages go with it.
create or replace function public.delete_my_account()
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'signed_out'; end if;
  -- a teacher's classes and old-style lessons are removed with them
  delete from public.lessons where teacher_id = me;
  delete from public.class_roster where teacher_id = me;
  delete from public.contact_messages where user_id = me;
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
  return true;
exception when foreign_key_violation then
  return false;
end;
$$;
