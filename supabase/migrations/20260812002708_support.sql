create type public.support_ticket_type as enum ('question', 'access', 'bug', 'suggestion', 'other');
create type public.support_ticket_status as enum ('open', 'answered', 'closed', 'finalized');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete restrict,
  assignee_id uuid references public.profiles(id) on delete set null,
  subject text not null check (char_length(btrim(subject)) between 3 and 180),
  type public.support_ticket_type not null,
  status public.support_ticket_status not null default 'open',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_requester_activity_idx on public.support_tickets (requester_id, last_activity_at desc);
create index support_tickets_status_activity_idx on public.support_tickets (status, last_activity_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);

create index support_messages_ticket_created_idx on public.support_messages (ticket_id, created_at);

create table public.support_internal_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.support_events (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z_]+$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_support_agent()
returns boolean language sql stable security invoker set search_path = public
as $$ select public.has_role('admin') or public.has_role('manager'); $$;

create or replace function public.set_ticket_activity()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  update public.support_tickets set last_activity_at = now(), updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

create trigger support_messages_set_ticket_activity
after insert on public.support_messages
for each row execute function public.set_ticket_activity();

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_internal_notes enable row level security;
alter table public.support_events enable row level security;

create policy "tickets: requester or agents read" on public.support_tickets for select to authenticated using (
  requester_id = (select auth.uid()) or public.is_support_agent()
);
create policy "tickets: requester opens own" on public.support_tickets for insert to authenticated with check (
  requester_id = (select auth.uid()) and assignee_id is null and status = 'open'
);
create policy "tickets: agents update" on public.support_tickets for update to authenticated using (public.is_support_agent()) with check (public.is_support_agent());

create policy "messages: ticket participants read" on public.support_messages for select to authenticated using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.requester_id = (select auth.uid()) or public.is_support_agent()))
);
create policy "messages: requester writes open tickets" on public.support_messages for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = (select auth.uid()) and t.status <> 'finalized')
);
create policy "messages: agents respond" on public.support_messages for insert to authenticated with check (
  author_id = (select auth.uid()) and public.is_support_agent()
);

create policy "notes: agents only" on public.support_internal_notes for all to authenticated using (public.is_support_agent()) with check (public.is_support_agent());
create policy "events: requester or agents read" on public.support_events for select to authenticated using (
  public.is_support_agent() or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = (select auth.uid()))
);
