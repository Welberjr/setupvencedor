create table public.mcp_oauth_clients (
  client_id text primary key check (client_id ~ '^setup_[a-z0-9]{16,64}$'),
  client_name text not null check (char_length(btrim(client_name)) between 1 and 120),
  redirect_uris text[] not null check (cardinality(redirect_uris) > 0),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table public.mcp_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  client_id text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redirect_uri text not null check (redirect_uri ~ '^https?://'),
  code_challenge text not null check (char_length(code_challenge) between 43 and 128),
  scope text not null default 'mcp:read',
  resource text not null check (resource ~ '^https://'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index mcp_authorization_codes_expires_at_idx on public.mcp_authorization_codes(expires_at);

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_authorization_codes enable row level security;

revoke all on public.mcp_oauth_clients, public.mcp_authorization_codes from anon, authenticated;
