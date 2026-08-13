alter table public.support_messages add column body_rich text not null default '';
alter table public.support_messages add constraint support_messages_body_rich_length check (char_length(body_rich) <= 12000);

create table public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique check (char_length(storage_path) between 1 and 900),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  created_at timestamptz not null default now()
);

create index support_attachments_ticket_created_idx on public.support_attachments (ticket_id, created_at);
alter table public.support_attachments enable row level security;
grant select, insert on public.support_attachments to authenticated;

create policy "attachments: ticket participants read" on public.support_attachments for select to authenticated using (
  exists (select 1 from public.support_tickets ticket where ticket.id = ticket_id and (ticket.requester_id = (select auth.uid()) or public.is_support_agent()))
);
create policy "attachments: requester adds to own ticket" on public.support_attachments for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = (select auth.uid())::text
  and split_part(storage_path, '/', 2) = ticket_id::text
  and exists (select 1 from public.support_tickets ticket where ticket.id = ticket_id and ticket.requester_id = (select auth.uid()) and ticket.status <> 'finalized')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-attachments', 'support-attachments', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "support attachments: participants download" on storage.objects for select to authenticated using (
  bucket_id = 'support-attachments'
  and exists (
    select 1 from public.support_attachments attachment
    join public.support_tickets ticket on ticket.id = attachment.ticket_id
    where attachment.storage_path = name and (ticket.requester_id = (select auth.uid()) or public.is_support_agent())
  )
);
create policy "support attachments: requester uploads" on storage.objects for insert to authenticated with check (
  bucket_id = 'support-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.support_tickets ticket
    where ticket.id::text = (storage.foldername(name))[2]
      and ticket.requester_id = (select auth.uid())
      and ticket.status <> 'finalized'
  )
);
create policy "support attachments: requester removes failed upload" on storage.objects for delete to authenticated using (
  bucket_id = 'support-attachments'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1 from public.support_tickets ticket
    where ticket.id::text = (storage.foldername(name))[2]
      and ticket.requester_id = (select auth.uid())
  )
);
