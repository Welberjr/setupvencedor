# Activity Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record reliable member activity, expose last access, and give administrators privacy-bounded usage analytics.

**Architecture:** A database RPC derives the actor from `auth.uid()`, updates the profile heartbeat, and inserts immutable events. The browser emits only validated, meaningful events through the Worker; the Worker authenticates the caller and exposes admin-only reports.

**Tech Stack:** React 19, TypeScript, Cloudflare Worker, Supabase Postgres/RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-20-activity-analytics-design.md`

## Global Constraints

- Keep existing access, invitation, and catalog behavior unchanged.
- Never persist passwords, tokens, IP addresses, user agents, support content, audio, or Assistant prompt/transcript text.
- Store a normalized catalog-search term of at most 160 characters only for an explicit catalog search.
- Retain raw activity events for exactly 18 months.
- Use `SECURITY INVOKER` and RLS; no browser-supplied user id is accepted.

---

### Task 1: Database activity contract

**Files:**
- Create: `supabase/migrations/20260820090000_activity_analytics.sql`
- Create: `supabase/tests/activity_analytics.sql`

**Interfaces:**
- Produces `public.activity_events` and `public.record_activity(event_kind text, catalog_item_id uuid, search_term text)`.
- Consumed by the Worker as `supabase.rpc('record_activity', payload)`.

- [ ] **Step 1: Write the failing SQL test**

```sql
select throws_ok(
  $$ select public.record_activity('resource_opened', null, null) $$,
  '42501',
  'anonymous callers cannot record activity'
);
```

- [ ] **Step 2: Run the SQL test in the linked staging project and verify it fails because the function does not exist.**

- [ ] **Step 3: Add the table, indexes, RLS policies, validating RPC, and daily 18-month cleanup schedule.**

- [ ] **Step 4: Re-run the SQL test and verify the function rejects an unauthenticated caller.**

- [ ] **Step 5: Commit the migration and SQL test.**

### Task 2: Worker tracking and reporting boundary

**Files:**
- Create: `worker/src/activity.ts`
- Create: `worker/src/activity.test.ts`
- Modify: `worker/src/index.ts`

**Interfaces:**
- Produces `recordActivityRequest(request, env)` and admin reporting handlers.
- Consumes `POST /v1/activity`, `GET /v1/admin/analytics`, and `GET /v1/admin/people/:id/activity`.

- [ ] **Step 1: Write failing tests that reject a browser supplied user id and accept a valid `resource_opened` event.**

```ts
expect(validateActivityInput({ eventType: 'resource_opened', userId: 'forged' })).toEqual({ eventType: 'resource_opened' })
```

- [ ] **Step 2: Run `npm run worker:test -- activity.test.ts` and verify the validator import fails.**

- [ ] **Step 3: Implement the validator, JWT-derived actor lookup, RPC write, 15-minute session throttling, and admin-only aggregate/history reads.**

- [ ] **Step 4: Re-run the focused Worker tests and verify they pass.**

- [ ] **Step 5: Commit the Worker changes.**

### Task 3: Browser instrumentation and administration UI

**Files:**
- Create: `src/lib/activity.ts`
- Create: `src/lib/activity.test.ts`
- Create: `src/features/admin/ActivityAnalytics.tsx`
- Create: `src/features/admin/ActivityAnalytics.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/features/catalog/ResourceProfilePage.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `trackActivity(event)` posts a validated event through the Worker without delaying the user action.
- The admin analytics component consumes the Worker reporting endpoints.

- [ ] **Step 1: Write a failing test that normalizes a submitted search and drops empty or overly long terms.**

```ts
expect(buildActivityEvent('catalog_search', { searchTerm: '  cloudflare   workers ' })).toEqual({ eventType: 'catalog_search', searchTerm: 'cloudflare workers' })
```

- [ ] **Step 2: Run `npm test -- src/lib/activity.test.ts` and verify the module is missing.**

- [ ] **Step 3: Implement the tracker and emit session, catalog-search, resource-opened, official-link, favorite, and Assistant-request events. Add the admin analytics rendering.**

- [ ] **Step 4: Run focused browser tests and verify event normalization and the period dashboard render.**

- [ ] **Step 5: Commit the client and UI changes.**

### Task 4: Verify and publish staging

**Files:**
- Modify only if verification reveals a defect.

- [ ] **Step 1: Run full client and Worker test suites, typecheck, lint, and build.**
- [ ] **Step 2: Apply the migration to the staging Supabase project and verify schema, RLS, indexes, and scheduled retention.**
- [ ] **Step 3: Deploy the staging Worker and static site.**
- [ ] **Step 4: Use a real authenticated staging session to create a test event and verify the last-access line plus admin reports.**
- [ ] **Step 5: Push the commits to `origin/staging` and report the completed staging deployment evidence.**
