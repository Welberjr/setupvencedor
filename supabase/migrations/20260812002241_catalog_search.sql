create type public.catalog_item_status as enum ('draft', 'published', 'archived');
create type public.catalog_item_visibility as enum ('team', 'restricted');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  item_type text not null check (char_length(btrim(item_type)) between 2 and 60),
  summary text not null check (char_length(btrim(summary)) between 20 and 500),
  own_content text not null check (char_length(btrim(own_content)) between 20 and 20000),
  official_url text not null check (official_url ~ '^https://'),
  instructions text not null check (char_length(btrim(instructions)) between 10 and 10000),
  status public.catalog_item_status not null default 'draft',
  visibility public.catalog_item_visibility not null default 'team',
  search_document tsvector generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(own_content, ''))
  ) stored,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published') = (published_at is not null)),
  check ((status = 'archived') = (archived_at is not null))
);

create table public.catalog_item_topics (
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete restrict,
  primary key (catalog_item_id, topic_id)
);

create table public.catalog_item_tags (
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  primary key (catalog_item_id, tag_id)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, catalog_item_id)
);

create index catalog_items_search_document_idx on public.catalog_items using gin(search_document);
create index catalog_items_status_idx on public.catalog_items(status, published_at desc);
create index catalog_items_author_idx on public.catalog_items(author_id);
create index favorites_item_idx on public.favorites(catalog_item_id);

alter table public.categories enable row level security;
alter table public.topics enable row level security;
alter table public.tags enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_item_topics enable row level security;
alter table public.catalog_item_tags enable row level security;
alter table public.favorites enable row level security;

revoke all on public.categories, public.topics, public.tags, public.catalog_items, public.catalog_item_topics, public.catalog_item_tags, public.favorites from anon;
grant select, insert, update, delete on public.categories, public.topics, public.tags, public.catalog_items, public.catalog_item_topics, public.catalog_item_tags, public.favorites to authenticated;

create or replace function public.protect_catalog_item_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.author_id is distinct from new.author_id then
    raise exception 'catalog item author is immutable';
  end if;
  if not public.has_role('admin') and not public.has_role('manager')
     and (old.status, old.visibility, old.published_at, old.archived_at) is distinct from
         (new.status, new.visibility, new.published_at, new.archived_at) then
    raise exception 'only managers and administrators can change publication fields';
  end if;
  return new;
end;
$$;

create trigger catalog_items_set_updated_at before update on public.catalog_items
for each row execute function public.set_updated_at();
create trigger catalog_items_protect_system_fields before update on public.catalog_items
for each row execute function public.protect_catalog_item_system_fields();

create policy "authenticated users read categories" on public.categories for select to authenticated using (true);
create policy "authenticated users read topics" on public.topics for select to authenticated using (true);
create policy "authenticated users read tags" on public.tags for select to authenticated using (true);
create policy "managers manage categories" on public.categories for all to authenticated using (public.has_role('manager') or public.has_role('admin')) with check (public.has_role('manager') or public.has_role('admin'));
create policy "managers manage topics" on public.topics for all to authenticated using (public.has_role('manager') or public.has_role('admin')) with check (public.has_role('manager') or public.has_role('admin'));
create policy "managers manage tags" on public.tags for all to authenticated using (public.has_role('manager') or public.has_role('admin')) with check (public.has_role('manager') or public.has_role('admin'));

create policy "users read published or owned catalog items" on public.catalog_items for select to authenticated using (status = 'published' or author_id = (select auth.uid()) or public.has_role('manager') or public.has_role('admin'));
create policy "contributors create owned catalog items" on public.catalog_items for insert to authenticated with check ((author_id = (select auth.uid()) and (public.has_role('editor') or public.has_role('manager') or public.has_role('admin'))) or public.has_role('manager') or public.has_role('admin'));
create policy "contributors update catalog items" on public.catalog_items for update to authenticated using ((author_id = (select auth.uid()) and public.has_role('editor')) or public.has_role('manager') or public.has_role('admin')) with check ((author_id = (select auth.uid()) and public.has_role('editor')) or public.has_role('manager') or public.has_role('admin'));
create policy "managers delete catalog items" on public.catalog_items for delete to authenticated using (public.has_role('manager') or public.has_role('admin'));

create policy "users read accessible catalog topics" on public.catalog_item_topics for select to authenticated using (exists (select 1 from public.catalog_items item where item.id = catalog_item_id));
create policy "users read accessible catalog tags" on public.catalog_item_tags for select to authenticated using (exists (select 1 from public.catalog_items item where item.id = catalog_item_id));
create policy "contributors manage topics on editable items" on public.catalog_item_topics for all to authenticated using (exists (select 1 from public.catalog_items item where item.id = catalog_item_id and (item.author_id = (select auth.uid()) or public.has_role('manager') or public.has_role('admin')))) with check (exists (select 1 from public.catalog_items item where item.id = catalog_item_id and (item.author_id = (select auth.uid()) or public.has_role('manager') or public.has_role('admin'))));
create policy "contributors manage tags on editable items" on public.catalog_item_tags for all to authenticated using (exists (select 1 from public.catalog_items item where item.id = catalog_item_id and (item.author_id = (select auth.uid()) or public.has_role('manager') or public.has_role('admin')))) with check (exists (select 1 from public.catalog_items item where item.id = catalog_item_id and (item.author_id = (select auth.uid()) or public.has_role('manager') or public.has_role('admin'))));

create policy "users read their favorites" on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy "users add their favorites" on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users remove their favorites" on public.favorites for delete to authenticated using (user_id = (select auth.uid()));
