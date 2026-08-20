begin;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'activity-member@example.com', 'not-used', now(), '{}', '{}', now(), now());

insert into public.profiles (id, email_normalized, full_name, state, activated_at)
values ('00000000-0000-0000-0000-0000000000e5', 'activity-member@example.com', 'Activity Member', 'active', now());

insert into public.activity_events (user_id, event_type)
values ('00000000-0000-0000-0000-0000000000e5', 'session_started');

select is((select count(*) from public.activity_events), 1::bigint, 'server-side activity events are retained');

select throws_ok(
  $$insert into public.activity_events (user_id, event_type) values ('00000000-0000-0000-0000-0000000000e5', 'catalog_search')$$,
  '23514',
  null,
  'a catalog search requires a normalized term'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e5', true);
select throws_ok(
  $$select * from public.activity_events$$,
  '42501',
  null,
  'a member cannot read the activity history directly'
);
select throws_ok(
  $$insert into public.activity_events (user_id, event_type) values ('00000000-0000-0000-0000-0000000000e5', 'session_started')$$,
  '42501',
  null,
  'a member cannot forge analytics events directly'
);
reset role;

select * from finish();

rollback;
