create type public.invitation_delivery as enum ('email', 'direct_link');

alter table public.invitations
  add column delivery public.invitation_delivery not null default 'email';

alter table public.invitations
  alter column email_normalized drop not null,
  alter column recipient_name drop not null;

alter table public.invitations
  add constraint invitations_delivery_identity_check check (
    (delivery = 'email' and email_normalized is not null)
    or delivery = 'direct_link'
  );

drop index public.invitations_one_live_email;

create unique index invitations_one_live_email
  on public.invitations (email_normalized)
  where delivery = 'email' and state in ('pending', 'claimed');

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
      delivery = 'email'
      or (activation_email is not null and lower(btrim(activation_email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    )
  returning invitations.id, invitations.email_normalized, invitations.recipient_name, invitations.job_title, invitations.roles, invitations.delivery;
end;
$$;

revoke all on function public.claim_invitation(text, text, text) from public;
grant execute on function public.claim_invitation(text, text, text) to service_role;
