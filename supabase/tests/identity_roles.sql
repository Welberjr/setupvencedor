begin;

select plan(5);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-a@example.com', 'not-used', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-b@example.com', 'not-used', now(), '{}', '{}', now(), now());

insert into public.profiles (id, email_normalized, full_name, state, activated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', 'member-a@example.com', 'Member A', 'active', now()),
  ('00000000-0000-0000-0000-0000000000b2', 'member-b@example.com', 'Member B', 'active', now());

insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-0000000000a1', 'member');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select is((select count(*) from public.profiles), 1::bigint, 'member reads only its profile');
select is((select count(*) from public.user_roles), 1::bigint, 'member reads only its roles');
select ok(not public.has_role('admin'), 'member is not an admin');
select throws_ok(
  $$update public.profiles set state = 'disabled', disabled_at = now() where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001',
  'only administrators can change profile access state',
  'member cannot disable its own account'
);
reset role;

select is((select count(*) from public.invitations), 0::bigint, 'invitations are not readable without server privileges');
select * from finish();

rollback;
