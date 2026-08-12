revoke execute on function public.claim_invitation(text) from anon, authenticated;
grant execute on function public.claim_invitation(text) to service_role;
