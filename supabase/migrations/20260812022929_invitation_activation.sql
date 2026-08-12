create or replace function public.claim_invitation(invitation_token_hash text)
returns table (id uuid, email_normalized text, recipient_name text, job_title text, roles public.app_role[])
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.invitations
  set state = 'claimed', claimed_at = now()
  where token_hash = invitation_token_hash
    and state = 'pending'
    and expires_at > now()
  returning invitations.id, invitations.email_normalized, invitations.recipient_name, invitations.job_title, invitations.roles;
end;
$$;

revoke all on function public.claim_invitation(text) from public;
grant execute on function public.claim_invitation(text) to service_role;
