# Activity Analytics Design

## Goal

Make the access directory show a reliable last access and give administrators a privacy-bounded history of how the team uses the platform.

## Scope

The application sends a validated activity event to the Worker after an authenticated session is available and when a member performs a meaningful action: opening a resource, submitting a catalog search, opening an official resource link, changing a favorite, or requesting the Assistant. The Worker derives the member from the JWT, updates `profiles.last_seen_at`, and inserts an immutable event. It never accepts a user id from the browser.

An administrator can request an aggregate dashboard or the paginated activity history for one member. The dashboard exposes top catalog searches, most opened resources, and event counts for a selected period. The member history exposes event time, type, resource title, and the submitted catalog search term when applicable.

## Privacy and retention

Events store only the event type, an optional catalog item, an optional normalized catalog-search term (maximum 160 characters), and the timestamp. They do not store passwords, tokens, IP addresses, user agents, audio, Assistant prompts/transcripts, support content, or attachment metadata. The event table has RLS and no browser SELECT access; the Worker is the only read path for administrators. Events are retained for 18 months and are deleted by a daily database schedule.

## Data and security

`public.activity_events` references `profiles` and `catalog_items`. A check constraint restricts event kinds. Browser writes are not granted to any role: the Worker verifies the caller's JWT, derives the person from it, updates `last_seen_at`, and inserts the event using its server credential. Administrators remain the only people who can inspect other members' activity through Worker endpoints.

## UI

The existing access directory continues to display `last_seen_at`. A new Analytics block on the administration page has period controls (7, 30, and 90 days), top searched terms, top opened resources, action totals, and a person-detail drawer with the latest activity. Failures leave the product usable and show a local administrative error message.

## Verification

Unit tests cover request validation, event payload construction, last-access reporting, and administrative rendering. SQL tests verify the caller cannot forge a user id and cannot read other members' history. Staging validation creates a controlled event with an authenticated test account, checks the visible last access and admin reporting endpoints, then confirms the production database is untouched.
