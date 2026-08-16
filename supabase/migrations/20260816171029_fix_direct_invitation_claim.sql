-- The output column named delivery shadows an unqualified delivery reference
-- inside this PL/pgSQL function. Keep the table qualification so direct-link
-- activation can atomically claim its pending invitation.
create or replace function public.claim_invitation(
  invitation_token_hash text,
  activation_email text default null,
  activation_recipient_name text default null
)
returns table (
  id uuid,
  email_normalized text,
  recipient_name text,
  job_title text,
  roles public.app_role[],
  delivery public.invitation_delivery
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.invitations
  set
    state = 'claimed',
    claimed_at = now(),
    email_normalized = case
      when invitations.delivery = 'direct_link' then lower(btrim(activation_email))
      else invitations.email_normalized
    end,
    recipient_name = coalesce(
      nullif(btrim(activation_recipient_name), ''),
      invitations.recipient_name,
      split_part(coalesce(lower(btrim(activation_email)), invitations.email_normalized), '@', 1)
    )
  where token_hash = invitation_token_hash
    and state = 'pending'
    and expires_at > now()
    and (
      invitations.delivery = 'email'
      or (activation_email is not null and lower(btrim(activation_email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    )
  returning invitations.id, invitations.email_normalized, invitations.recipient_name, invitations.job_title, invitations.roles, invitations.delivery;
end;
$$;

revoke all on function public.claim_invitation(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_invitation(text, text, text) to service_role;
