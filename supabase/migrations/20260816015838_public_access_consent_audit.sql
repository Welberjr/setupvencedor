create table public.legal_acceptances (
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_key text not null check (document_key in ('terms_of_use', 'privacy_policy')),
  document_version text not null check (document_version ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'),
  accepted_at timestamptz not null default now(),
  primary key (user_id, document_key, document_version)
);

alter table public.legal_acceptances enable row level security;

revoke all on public.legal_acceptances from anon;
revoke all on public.legal_acceptances from authenticated;
grant select on public.legal_acceptances to authenticated;

create policy "users read their own legal acceptances"
on public.legal_acceptances for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.create_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  profile_phone text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  consent_version text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'terms_version', '')), '');
  has_consent boolean := coalesce(new.raw_user_meta_data ->> 'terms_accepted', 'false') = 'true';
  is_confirmed boolean := new.email_confirmed_at is not null;
begin
  insert into public.profiles (id, email_normalized, full_name, phone, state, activated_at)
  values (
    new.id,
    lower(btrim(new.email)),
    coalesce(profile_name, split_part(new.email, '@', 1)),
    profile_phone,
    case when is_confirmed and has_consent then 'active'::public.profile_state else 'invited'::public.profile_state end,
    case when is_confirmed and has_consent then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member'::public.app_role)
  on conflict (user_id, role) do nothing;

  if has_consent and consent_version is not null then
    insert into public.legal_acceptances (user_id, document_key, document_version)
    values
      (new.id, 'terms_of_use', consent_version),
      (new.id, 'privacy_policy', consent_version)
    on conflict (user_id, document_key, document_version) do nothing;

    insert into public.audit_events (target_user_id, event_type, payload)
    values (new.id, 'public_signup.created', jsonb_build_object('terms_version', consent_version));

    if is_confirmed then
      insert into public.audit_events (actor_id, target_user_id, event_type, payload)
      values (new.id, new.id, 'public_signup.confirmed', jsonb_build_object('terms_version', consent_version));
    end if;
  end if;

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
declare
  consent_version text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'terms_version', '')), '');
  has_consent boolean := coalesce(new.raw_user_meta_data ->> 'terms_accepted', 'false') = 'true';
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    if has_consent and consent_version is not null then
      update public.profiles
        set state = 'active', activated_at = coalesce(activated_at, now()), disabled_at = null
        where id = new.id and state = 'invited';

      insert into public.audit_events (actor_id, target_user_id, event_type, payload)
      values (new.id, new.id, 'public_signup.confirmed', jsonb_build_object('terms_version', consent_version));
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.activate_confirmed_profile() from public;
