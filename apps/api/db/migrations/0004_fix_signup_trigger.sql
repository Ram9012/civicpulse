-- Fix: "Database error saving new user" on sign-up.
-- Supabase Auth runs the trigger as its own role, whose search_path does not include `public`,
-- so the unqualified `profiles` in 0001 could not be resolved. Pin the search_path and
-- schema-qualify the table. Safe to run more than once.

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), nullif(split_part(new.email, '@', 1), ''), 'User')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth users that exist without a profile.
insert into public.profiles (id, name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'name', ''), nullif(split_part(u.email, '@', 1), ''), 'User')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
