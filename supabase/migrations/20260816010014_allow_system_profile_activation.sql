-- Auth confirmation and trusted server-side administration run without an
-- end-user JWT. Keep the profile guard for signed-in users while allowing
-- those internal flows to activate a profile.
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
     and auth.uid() is not null
     and not public.has_role('admin') then
    raise exception 'only administrators can change profile access state';
  end if;

  return new;
end;
$$;
