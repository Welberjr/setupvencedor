create policy "admins manage invitations"
on public.invitations for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "admins read audit events"
on public.audit_events for select to authenticated
using (public.has_role('admin'));

create index audit_events_actor_id_idx on public.audit_events(actor_id);
create index audit_events_target_user_id_idx on public.audit_events(target_user_id);
create index audit_events_invitation_id_idx on public.audit_events(invitation_id);
create index invitations_created_by_idx on public.invitations(created_by);
create index invitations_accepted_by_idx on public.invitations(accepted_by);
