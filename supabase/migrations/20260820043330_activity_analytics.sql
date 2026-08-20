create extension if not exists pg_cron with schema pg_catalog;

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('session_started', 'catalog_search', 'resource_opened', 'resource_source_opened', 'favorite_added', 'favorite_removed', 'assistant_requested')),
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  search_term text,
  created_at timestamptz not null default now(),
  constraint activity_events_payload_shape check (
    (event_type = 'catalog_search' and search_term is not null and char_length(search_term) between 1 and 160 and catalog_item_id is null)
    or (event_type in ('resource_opened', 'resource_source_opened', 'favorite_added', 'favorite_removed') and catalog_item_id is not null and search_term is null)
    or (event_type in ('session_started', 'assistant_requested') and catalog_item_id is null and search_term is null)
  )
);

create index activity_events_user_created_at_idx on public.activity_events(user_id, created_at desc);
create index activity_events_event_created_at_idx on public.activity_events(event_type, created_at desc);
create index activity_events_catalog_created_at_idx on public.activity_events(catalog_item_id, created_at desc) where catalog_item_id is not null;
create index activity_events_search_created_at_idx on public.activity_events(search_term, created_at desc) where search_term is not null;

alter table public.activity_events enable row level security;
revoke all on public.activity_events from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-setup-vencedor-activity-events';

select cron.schedule(
  'purge-setup-vencedor-activity-events',
  '17 3 * * *',
  $$delete from public.activity_events where created_at < now() - interval '18 months'$$
);
