create table public.catalog_item_sources (
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  source_url text not null check (source_url ~ '^https://'),
  created_at timestamptz not null default now(),
  primary key (catalog_item_id, source_url)
);

create index catalog_item_sources_item_idx on public.catalog_item_sources(catalog_item_id);

alter table public.catalog_item_sources enable row level security;

revoke all on public.catalog_item_sources from anon;
grant select, insert, update, delete on public.catalog_item_sources to authenticated;

create policy "users read sources from accessible catalog items"
on public.catalog_item_sources for select to authenticated
using (
  exists (
    select 1
    from public.catalog_items item
    where item.id = catalog_item_id
  )
);

create policy "managers manage catalog sources"
on public.catalog_item_sources for all to authenticated
using (public.has_role('manager') or public.has_role('admin'))
with check (public.has_role('manager') or public.has_role('admin'));
