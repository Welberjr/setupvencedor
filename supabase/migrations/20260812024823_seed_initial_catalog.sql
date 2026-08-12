insert into public.categories (name, slug)
values ('Plugins', 'plugins'), ('MCPs', 'mcps')
on conflict (slug) do update set name = excluded.name;

insert into public.topics (name, slug)
values ('Frontend', 'frontend'), ('Documentação', 'documentacao'), ('Testes', 'testes')
on conflict (slug) do update set name = excluded.name;

insert into public.tags (name, slug, aliases)
values
  ('Interface', 'interface', array['ui', 'layout']),
  ('Documentação', 'documentacao', array['docs', 'api']),
  ('Navegador', 'navegador', array['browser', 'e2e', 'qa'])
on conflict (slug) do update set name = excluded.name, aliases = excluded.aliases;

do $$
declare
  catalog_author uuid;
begin
  select profile.id into catalog_author
  from public.profiles profile
  join public.user_roles role on role.user_id = profile.id and role.role = 'admin'
  where profile.state = 'active'
  order by profile.created_at asc
  limit 1;

  if catalog_author is null then
    raise exception 'an active administrator is required before seeding the catalog';
  end if;

  insert into public.catalog_items (category_id, author_id, title, slug, item_type, summary, own_content, official_url, instructions, status, published_at)
  select category.id, catalog_author, seed.title, seed.slug, seed.item_type, seed.summary, seed.own_content, seed.official_url, seed.instructions, 'published', now()
  from (values
    ('plugins', 'Frontend Design', 'frontend-design', 'Plugin', 'Orientações para criar interfaces com intenção visual e evitar resultados genéricos.', 'Use antes de implementar ou redesenhar uma interface web. Ele ajuda a transformar requisitos em decisões visuais mais consistentes.', 'https://github.com/anthropics/claude-code', '/plugin install frontend-design@claude-plugins-official'),
    ('mcps', 'Context7', 'context7', 'MCP', 'Documentação atualizada de bibliotecas diretamente no contexto do agente.', 'Reduz o risco de seguir APIs antigas ao pesquisar como instalar, configurar ou usar uma dependência.', 'https://github.com/upstash/context7', 'npx @upstash/context7-mcp'),
    ('mcps', 'Playwright MCP', 'playwright', 'MCP', 'Ferramenta para o agente validar fluxos reais em um navegador.', 'Use para testar telas, formulários e jornadas críticas com evidência do comportamento visível.', 'https://github.com/microsoft/playwright-mcp', 'claude mcp add playwright npx @playwright/mcp@latest')
  ) as seed(category_slug, title, slug, item_type, summary, own_content, official_url, instructions)
  join public.categories category on category.slug = seed.category_slug
  on conflict (slug) do nothing;

  insert into public.catalog_item_topics (catalog_item_id, topic_id)
  select item.id, topic.id
  from (values ('frontend-design', 'frontend'), ('context7', 'documentacao'), ('playwright', 'testes')) as map(item_slug, topic_slug)
  join public.catalog_items item on item.slug = map.item_slug
  join public.topics topic on topic.slug = map.topic_slug
  on conflict do nothing;

  insert into public.catalog_item_tags (catalog_item_id, tag_id)
  select item.id, tag.id
  from (values ('frontend-design', 'interface'), ('context7', 'documentacao'), ('playwright', 'navegador')) as map(item_slug, tag_slug)
  join public.catalog_items item on item.slug = map.item_slug
  join public.tags tag on tag.slug = map.tag_slug
  on conflict do nothing;
end $$;
