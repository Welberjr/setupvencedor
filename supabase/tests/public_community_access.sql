begin;

select plan(2);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-0000000000c3',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'confirmation-test@example.com',
  'not-used',
  '{}',
  '{"full_name":"Confirmation Test"}',
  now(),
  now()
);

select lives_ok(
  $$
    update auth.users
    set email_confirmed_at = now()
    where id = '00000000-0000-0000-0000-0000000000c3'
  $$,
  'the Auth confirmation trigger can activate the new profile'
);

select results_eq(
  $$
    select state::text
    from public.profiles
    where id = '00000000-0000-0000-0000-0000000000c3'
  $$,
  array['active'],
  'email confirmation activates the profile'
);

select * from finish();

rollback;
