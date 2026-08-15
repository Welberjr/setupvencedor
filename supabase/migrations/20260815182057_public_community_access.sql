alter table public.profiles
  add column if not exists phone text,
  add column if not exists last_seen_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_length
      check (phone is null or char_length(btrim(phone)) between 7 and 32);
  end if;
end
$$;

create index if not exists profiles_created_at_desc_idx on public.profiles(created_at desc);
create index if not exists profiles_last_seen_at_desc_idx on public.profiles(last_seen_at desc nulls last);

create or replace function public.create_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  profile_phone text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  is_confirmed boolean := new.email_confirmed_at is not null;
begin
  insert into public.profiles (id, email_normalized, full_name, phone, state, activated_at)
  values (
    new.id,
    lower(btrim(new.email)),
    coalesce(profile_name, split_part(new.email, '@', 1)),
    profile_phone,
    case when is_confirmed then 'active'::public.profile_state else 'invited'::public.profile_state end,
    case when is_confirmed then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke all on function public.create_public_profile() from public;

create or replace function public.activate_confirmed_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
      set state = 'active', activated_at = coalesce(activated_at, now()), disabled_at = null
      where id = new.id and state = 'invited';
  end if;
  return new;
end;
$$;

revoke all on function public.activate_confirmed_profile() from public;

drop trigger if exists on_public_auth_user_created on auth.users;
create trigger on_public_auth_user_created
  after insert on auth.users
  for each row execute function public.create_public_profile();

drop trigger if exists on_public_auth_user_confirmed on auth.users;
create trigger on_public_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.activate_confirmed_profile();

create or replace function public.record_profile_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.profiles
    set last_seen_at = now()
    where id = auth.uid()
      and (last_seen_at is null or last_seen_at < now() - interval '15 minutes');
end;
$$;

revoke all on function public.record_profile_activity() from public;
grant execute on function public.record_profile_activity() to authenticated;
