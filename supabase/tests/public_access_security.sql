begin;

select plan(16);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-0000000000e1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'public-signup@example.com', 'not-used',
  '{}', '{"full_name":"Public Signup","terms_accepted":true,"terms_version":"2026-08-15"}', now(), now()
);

select is(
  (select count(*) from public.legal_acceptances where user_id = '00000000-0000-0000-0000-0000000000e1'),
  2::bigint,
  'signup metadata creates the terms and privacy consent records'
);

select is(
  (select count(*) from public.audit_events where target_user_id = '00000000-0000-0000-0000-0000000000e1' and event_type = 'public_signup.created'),
  1::bigint,
  'public signup is audited without token data'
);

update auth.users
set email_confirmed_at = now()
where id = '00000000-0000-0000-0000-0000000000e1';

select is(
  (select state from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'active',
  'a confirmed public signup becomes active'
);

select is(
  (select count(*) from public.audit_events where target_user_id = '00000000-0000-0000-0000-0000000000e1' and event_type = 'public_signup.confirmed'),
  1::bigint,
  'email confirmation is audited'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select throws_ok(
  $$insert into public.audit_events (event_type) values ('public_signup.forged')$$,
  '42501',
  null,
  'members cannot forge audit events'
);
reset role;

select ok(
  not has_function_privilege('anon', 'public.create_public_profile()', 'execute'),
  'anonymous users cannot execute the signup trigger function directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.create_public_profile()', 'execute'),
  'members cannot execute the signup trigger function directly'
);

select ok(
  not has_function_privilege('anon', 'public.activate_confirmed_profile()', 'execute'),
  'anonymous users cannot execute the confirmation trigger function directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.activate_confirmed_profile()', 'execute'),
  'members cannot execute the confirmation trigger function directly'
);

select ok(
  not has_function_privilege('anon', 'public.claim_invitation(text, text, text)', 'execute'),
  'anonymous users cannot claim invitations directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.claim_invitation(text, text, text)', 'execute'),
  'members cannot claim invitations directly'
);

select ok(
  has_function_privilege('service_role', 'public.claim_invitation(text, text, text)', 'execute'),
  'only the service role can claim invitations'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.record_profile_activity()'::regprocedure),
  false,
  'activity tracking uses the caller permissions instead of bypassing RLS'
);

select ok(
  has_function_privilege('authenticated', 'public.record_profile_activity()', 'execute'),
  'members can register their own activity'
);

select ok(
  not has_function_privilege('anon', 'public.record_profile_activity()', 'execute'),
  'anonymous users cannot register profile activity'
);

select * from finish();

rollback;
