-- hardened public function execution: triggers remain privileged but no browser
-- role can invoke them directly. Activity updates respect the caller's RLS.
revoke all on function public.create_public_profile() from public, anon, authenticated;
revoke all on function public.activate_confirmed_profile() from public, anon, authenticated;

revoke all on function public.claim_invitation(text) from public, anon, authenticated;
grant execute on function public.claim_invitation(text) to service_role;

revoke all on function public.claim_invitation(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_invitation(text, text, text) to service_role;

create or replace function public.record_profile_activity()
returns void
language plpgsql
security invoker
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

revoke all on function public.record_profile_activity() from public, anon;
grant execute on function public.record_profile_activity() to authenticated;
