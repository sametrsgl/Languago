-- Languago 2.0: "Bize yazın" contact form. Messages are kept here (the owner
-- Applied to production on 2026-10-11 (SQL editor, approved by the owner).
-- also gets an e-mail); only the server reads them (service role), nobody
-- else. A signed-in sender is linked to their account.

create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references public.profiles(id) on delete set null,
  name        text not null check (length(name) between 1 and 80),
  email       text not null check (length(email) between 3 and 160 and email like '%_@_%'),
  topic       text not null check (topic in ('genel','hesap','ders','icerik','kurum','premium','kvkk')),
  message     text not null check (length(message) between 5 and 3000),
  page        text check (length(page) <= 200),
  status      text not null default 'new' check (status in ('new','answered','closed')),
  handled_at  timestamptz
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
-- no policies: visitors write through submit_contact only; the owner reads with the service role

-- Save one message. Limits: 5 a day per e-mail address, 300 a day overall.
create or replace function public.submit_contact(p_name text, p_email text, p_topic text, p_message text, p_page text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint; em text := lower(trim(p_email));
begin
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
revoke all on function public.submit_contact(text, text, text, text, text) from public;
grant execute on function public.submit_contact(text, text, text, text, text) to anon, authenticated;
