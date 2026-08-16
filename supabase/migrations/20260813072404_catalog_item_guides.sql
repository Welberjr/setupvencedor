create table public.catalog_item_guides (
  catalog_item_id uuid primary key references public.catalog_items(id) on delete cascade,
  plain_language text not null check (char_length(trim(plain_language)) between 80 and 600),
  solves text not null check (char_length(trim(solves)) between 80 and 1000),
  when_to_use text not null check (char_length(trim(when_to_use)) between 80 and 1000),
  when_not_to_use text not null check (char_length(trim(when_not_to_use)) between 80 and 1000),
  first_steps text[] not null check (cardinality(first_steps) between 2 and 4),
  level text not null check (level in ('iniciante', 'intermediario', 'avancado')),
  prerequisites text[] not null default '{}',
  estimated_minutes smallint not null check (estimated_minutes between 1 and 600),
  source_checked_at timestamptz not null,
  source_note text not null check (char_length(trim(source_note)) between 12 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (array_position(first_steps, '') is null)
);

create trigger catalog_item_guides_set_updated_at
before update on public.catalog_item_guides
for each row execute function public.set_updated_at();

alter table public.catalog_item_guides enable row level security;

revoke all on public.catalog_item_guides from anon;
grant select, insert, update, delete on public.catalog_item_guides to authenticated;

create policy "users read guides from accessible catalog items"
on public.catalog_item_guides for select to authenticated
using (exists (select 1 from public.catalog_items item where item.id = catalog_item_id));

create policy "managers manage catalog guides"
on public.catalog_item_guides for all to authenticated
using (public.has_role('manager') or public.has_role('admin'))
with check (public.has_role('manager') or public.has_role('admin'));
