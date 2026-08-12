begin;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'catalog-a@example.com', 'not-used', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'catalog-b@example.com', 'not-used', now(), '{}', '{}', now(), now());
insert into public.profiles (id, email_normalized, full_name, state, activated_at) values
  ('00000000-0000-0000-0000-0000000000c3', 'catalog-a@example.com', 'Catalog A', 'active', now()),
  ('00000000-0000-0000-0000-0000000000d4', 'catalog-b@example.com', 'Catalog B', 'active', now());
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000c3', 'member'),
  ('00000000-0000-0000-0000-0000000000d4', 'editor');
insert into public.categories (id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Ferramentas', 'ferramentas');
insert into public.catalog_items (id, category_id, author_id, title, slug, item_type, summary, own_content, official_url, instructions, status, published_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d4', 'Item publicado', 'item-publicado', 'tool', 'Resumo proprio com tamanho suficiente.', 'Conteudo proprio com tamanho suficiente para teste.', 'https://example.com/published', 'Use conforme a documentacao oficial.', 'published', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d4', 'Item rascunho', 'item-rascunho', 'tool', 'Resumo proprio com tamanho suficiente.', 'Conteudo proprio com tamanho suficiente para teste.', 'https://example.com/draft', 'Use conforme a documentacao oficial.', 'draft');
insert into public.favorites (user_id, catalog_item_id) values ('00000000-0000-0000-0000-0000000000d4', '20000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);
select is((select count(*) from public.catalog_items), 1::bigint, 'member reads published items only');
select is((select count(*) from public.favorites), 0::bigint, 'member cannot read another users favorites');
select lives_ok($$insert into public.favorites (user_id, catalog_item_id) values ('00000000-0000-0000-0000-0000000000c3', '20000000-0000-0000-0000-000000000001')$$, 'member can favorite an accessible published item');
select is((select count(*) from public.favorites), 1::bigint, 'member sees its own favorite after insert');
select * from finish();

rollback;
