create extension if not exists vector with schema extensions;

create table public.catalog_item_embeddings (
  catalog_item_id uuid primary key references public.catalog_items(id) on delete cascade,
  content_hash text not null check (char_length(content_hash) = 64),
  embedding extensions.vector(1024) not null,
  indexed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_item_embeddings_embedding_idx on public.catalog_item_embeddings using hnsw (embedding extensions.vector_cosine_ops);

create table public.assistant_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_kind text not null check (request_kind in ('text', 'audio')),
  outcome text not null check (outcome in ('success', 'fallback', 'rate_limited', 'rejected', 'failed')),
  created_at timestamptz not null default now()
);

create index assistant_usage_events_user_created_idx on public.assistant_usage_events(user_id, created_at desc);

alter table public.catalog_item_embeddings enable row level security;
alter table public.assistant_usage_events enable row level security;

revoke all on public.catalog_item_embeddings, public.assistant_usage_events from anon, authenticated;

create or replace function public.search_catalog_for_assistant(query_text text, query_embedding extensions.vector(1024), match_count integer default 20)
returns table (id uuid, slug text, title text, item_type text, category text, summary text, own_content text, official_url text, instructions text, relevance double precision)
language sql security invoker set search_path = public, extensions stable as $$
  with parameters as (select websearch_to_tsquery('portuguese', left(query_text, 1500)) as ts_query),
  text_rank as (select item.id, row_number() over (order by ts_rank_cd(item.search_document, parameters.ts_query) desc) as position from public.catalog_items item cross join parameters where item.status = 'published' and item.search_document @@ parameters.ts_query limit 60),
  semantic_rank as (select item.id, row_number() over (order by embedding.embedding <=> query_embedding) as position from public.catalog_item_embeddings embedding join public.catalog_items item on item.id = embedding.catalog_item_id where item.status = 'published' limit 60),
  candidates as (select id from text_rank union select id from semantic_rank)
  select item.id, item.slug, item.title, item.item_type, category.name, item.summary, item.own_content, item.official_url, item.instructions,
    (coalesce(1.0 / (60 + text_rank.position), 0) + coalesce(1.0 / (60 + semantic_rank.position), 0))::double precision as relevance
  from candidates join public.catalog_items item on item.id = candidates.id join public.categories category on category.id = item.category_id
  left join text_rank on text_rank.id = item.id left join semantic_rank on semantic_rank.id = item.id
  order by relevance desc, item.published_at desc limit greatest(1, least(match_count, 20));
$$;

revoke all on function public.search_catalog_for_assistant(text, extensions.vector, integer) from public, anon, authenticated;
grant execute on function public.search_catalog_for_assistant(text, extensions.vector, integer) to service_role;
