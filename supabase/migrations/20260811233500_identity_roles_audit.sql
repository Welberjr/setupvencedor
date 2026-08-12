create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'manager', 'editor', 'member');
create type public.profile_state as enum ('invited', 'active', 'disabled');
create type public.invitation_state as enum ('pending', 'claimed', 'accepted', 'revoked', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email_normalized text not null unique check (email_normalized = lower(btrim(email_normalized))),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  job_title text check (char_length(job_title) <= 120),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  state public.profile_state not null default 'invited',
  activated_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'active') = (activated_at is not null)),
  check ((state = 'disabled') = (disabled_at is not null))
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
  recipient_name text not null check (char_length(btrim(recipient_name)) between 1 and 120),
  job_title text check (job_title is null or char_length(job_title) <= 120),
  roles public.app_role[] not null check (cardinality(roles) > 0),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  state public.invitation_state not null default 'pending',
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  claimed_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((state = 'claimed') = (claimed_at is not null)),
  check ((state = 'accepted') = (accepted_at is not null and accepted_by is not null)),
  check ((state = 'revoked') = (revoked_at is not null and revoked_by is not null))
);

create unique index invitations_one_live_email
  on public.invitations (email_normalized)
  where state in ('pending', 'claimed');

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  invitation_id uuid references public.invitations(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (not (payload ?| array['password', 'token', 'access_token', 'refresh_token', 'secret']))
);

create index user_roles_user_id_idx on public.user_roles(user_id);
create index invitations_expiry_idx on public.invitations(expires_at) where state in ('pending', 'claimed');
create index audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.profiles, public.user_roles, public.invitations, public.audit_events from anon;
revoke all on public.invitations, public.audit_events from authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

create or replace function public.has_role(required public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = required
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.id is distinct from new.id or old.email_normalized is distinct from new.email_normalized then
    raise exception 'profile identity is immutable';
  end if;

  if (old.state, old.activated_at, old.disabled_at) is distinct from (new.state, new.activated_at, new.disabled_at)
     and not public.has_role('admin') then
    raise exception 'only administrators can change profile access state';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profiles_protect_system_fields
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

create policy "users read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "managers and admins read profiles"
on public.profiles for select to authenticated
using (public.has_role('manager') or public.has_role('admin'));

create policy "users update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "users read their own roles"
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);
