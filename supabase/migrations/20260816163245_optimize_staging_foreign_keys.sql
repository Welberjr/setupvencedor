-- Covers the foreign-key access paths reported by the staging performance advisor.
-- These indexes are intentionally narrow: every one supports a concrete reference
-- without changing RLS or granting any additional database access.

create index if not exists catalog_item_tags_tag_id_idx on public.catalog_item_tags (tag_id);
create index if not exists catalog_item_topics_topic_id_idx on public.catalog_item_topics (topic_id);
create index if not exists catalog_items_category_id_idx on public.catalog_items (category_id);
create index if not exists invitations_revoked_by_idx on public.invitations (revoked_by);
create index if not exists mcp_authorization_codes_client_id_idx on public.mcp_authorization_codes (client_id);
create index if not exists mcp_authorization_codes_user_id_idx on public.mcp_authorization_codes (user_id);
create index if not exists support_attachments_uploaded_by_idx on public.support_attachments (uploaded_by);
create index if not exists support_events_actor_id_idx on public.support_events (actor_id);
create index if not exists support_events_ticket_id_idx on public.support_events (ticket_id);
create index if not exists support_internal_notes_author_id_idx on public.support_internal_notes (author_id);
create index if not exists support_internal_notes_ticket_id_idx on public.support_internal_notes (ticket_id);
create index if not exists support_messages_author_id_idx on public.support_messages (author_id);
create index if not exists support_tickets_assignee_id_idx on public.support_tickets (assignee_id);
create index if not exists user_roles_granted_by_idx on public.user_roles (granted_by);
