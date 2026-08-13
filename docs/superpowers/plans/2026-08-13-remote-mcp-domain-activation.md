# Remote MCP and Domain Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a private, OAuth-protected Streamable HTTP MCP at `https://setupvencedor.com.br/api/mcp`, an admin-only MCP control panel, and a Cloudflare hourly activation monitor.

**Architecture:** The Cloudflare Worker acts as both MCP resource server and OAuth authorization server, while Supabase stores only hashed authorization artefacts and technical activation events. The React administration page calls an authenticated Worker status endpoint; it never receives OAuth signing material, Resend keys, service-role credentials, or Cloudflare API credentials. The Worker owns `/api/*` and `/.well-known/*`; Cloudflare Pages continues to own all other paths.

**Tech Stack:** React 19 + TypeScript + Vite, Cloudflare Workers + Wrangler, Supabase Postgres/Auth/RLS, Web Crypto, Vitest, Cloudflare Pages, Resend.

**Spec:** `docs/superpowers/specs/2026-08-13-remote-mcp-domain-activation-design.md`

## Global Constraints

- Keep the Setup Vencedor private: no public registration, no MCP writes, no generative or paid AI, no videos, and no copied editorial content.
- Preserve strict RLS; use the Supabase service role only inside the Worker and never expose secrets to React, MCP tool output, logs, or Git.
- Use OAuth Authorization Code with PKCE, a resource-specific audience of `https://setupvencedor.com.br/api/mcp`, short-lived access tokens, hashed one-time codes, and rotated hashed refresh tokens.
- MCP tools are `search_resources`, `get_resource`, `list_by_kind`, and `recommend_for_project`; all carry `readOnlyHint: true` and return only published team-visible resources.
- Worker routes are `setupvencedor.com.br/api/*` and `setupvencedor.com.br/.well-known/*`; Pages serves the remaining host paths.
- The hourly Worker Cron records checks, sends at most one activation notice, and does not mutate catalog or user data.
- Do not read, print, copy, or commit `Chaves.txt`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260813050000_mcp_oauth_and_activation.sql` | OAuth artefact tables, technical events, indexes, RLS and admin-read policy. |
| `supabase/tests/mcp_oauth_rls.sql` | Proves browser roles cannot read/write token-bearing OAuth tables and only admins can view activation events. |
| `worker/src/oauth.ts` | OAuth metadata, client registration, authorization-code PKCE validation, signed access tokens and refresh rotation. |
| `worker/src/mcp.ts` | Streamable HTTP protocol envelope, bearer validation and four read-only catalog tools. |
| `worker/src/domain-monitor.ts` | Scheduled Cloudflare/Pages/Resend checks, idempotent event logging and one-time administrator notification. |
| `worker/src/index.ts` | Routes `/api/mcp`, OAuth endpoints, well-known metadata, admin MCP status and the scheduled handler. |
| `worker/src/env.ts` | Worker-only binding contract. |
| `worker/src/mcp.test.ts` | JSON-RPC, OAuth error discovery, tool visibility and read-only contract tests. |
| `worker/src/oauth.test.ts` | PKCE, expiry, audience and refresh-rotation tests. |
| `worker/src/domain-monitor.test.ts` | Activation decision and single-notification tests. |
| `worker/wrangler.jsonc` | Hourly trigger and deployment-safe Worker configuration. |
| `src/features/admin/McpControlPanel.tsx` | Admin-only status, endpoint/config copy action, tools and event history. |
| `src/features/admin/McpControlPanel.test.tsx` | Browser-facing security/status/copy behavior. |
| `src/app/App.tsx` | Renders `McpControlPanel` inside existing Administration and OAuth consent route. |
| `src/features/auth/McpAuthorizePage.tsx` | Logged-in approval/deny UI for OAuth authorization requests. |
| `src/lib/api/worker.ts` | Adds typed authenticated Worker request helper without changing the public panel API. |
| `src/styles.css` | Scoped MCP administration and consent styles, including mobile layout. |

### Task 1: Persist OAuth and activation state under strict RLS

**Files:**
- Create: `supabase/migrations/20260813050000_mcp_oauth_and_activation.sql`
- Create: `supabase/tests/mcp_oauth_rls.sql`

**Interfaces:**
- Produces `mcp_oauth_clients`, `mcp_authorization_codes`, `mcp_refresh_tokens`, `mcp_consents`, and `mcp_activation_events`.
- Later Worker functions use service-role queries keyed by `client_id`, `code_hash`, `token_hash`, `user_id`, and `event_key`.

- [ ] **Step 1: Write the failing SQL RLS test**

```sql
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select count(*) from public.mcp_refresh_tokens;
-- expected: permission denied or zero rows; browser roles never read bearer artefacts
```

- [ ] **Step 2: Run the database test before the migration**

Run: `supabase test db --file supabase/tests/mcp_oauth_rls.sql`

Expected: FAIL because the MCP OAuth schema does not exist.

- [ ] **Step 3: Create the migration**

```sql
create table public.mcp_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  scope text not null,
  resource text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table public.mcp_authorization_codes enable row level security;
revoke all on public.mcp_authorization_codes from anon, authenticated;
```

Add analogous hashed-only refresh-token storage, public-client registration metadata, consent records and append-only activation events. Add indexes for unconsumed codes, active refresh tokens and activation event time. Enable RLS for every table; expose only activation-event `SELECT` to `public.has_role('admin')`; keep all OAuth tables inaccessible to browser roles.

- [ ] **Step 4: Run migration and RLS test**

Run: `supabase db reset && supabase test db --file supabase/tests/mcp_oauth_rls.sql`

Expected: PASS; no authenticated or anonymous role can select or write token-bearing rows.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260813050000_mcp_oauth_and_activation.sql supabase/tests/mcp_oauth_rls.sql
git commit -m "feat: add MCP OAuth storage"
```

### Task 2: Build the OAuth 2.1 + PKCE primitives

**Files:**
- Create: `worker/src/oauth.ts`
- Create: `worker/src/oauth.test.ts`
- Modify: `worker/src/env.ts`
- Modify: `worker/package.json`

**Interfaces:**
- Produces `oauthMetadata(env)`, `protectedResourceMetadata(env)`, `registerClient(request, env)`, `beginAuthorization(request, env)`, `approveAuthorization(request, env, userId)`, `exchangeToken(request, env)`, and `validateMcpAccessToken(value, env)`.
- `validateMcpAccessToken` returns `{ userId: string; scopes: string[] }` only for active, correctly-audienced tokens.

- [ ] **Step 1: Write failing PKCE and audience tests**

```ts
it('rejects an authorization-code exchange with a different verifier', async () => {
  await expect(exchangeToken(requestWith({ code_verifier: 'wrong' }), env)).resolves.toMatchObject({ status: 400 })
})

it('rejects a token for another protected resource', async () => {
  await expect(validateMcpAccessToken(otherAudienceToken, env)).rejects.toThrow('invalid_token')
})
```

- [ ] **Step 2: Run the focused test before implementation**

Run: `npm test -- --run src/oauth.test.ts`

Expected: FAIL because `oauth.ts` is absent.

- [ ] **Step 3: Implement OAuth endpoints and bindings**

Use Web Crypto SHA-256 for code challenge verification and token hashes. Add Worker-only `MCP_OAUTH_SIGNING_KEY`, `MCP_PUBLIC_ORIGIN`, `MCP_ACCESS_TOKEN_TTL_SECONDS`, and `MCP_REFRESH_TOKEN_TTL_SECONDS` bindings. Emit resource metadata that names `https://setupvencedor.com.br/api/mcp`; reject non-HTTPS redirect URIs except `http://localhost` and `http://127.0.0.1` loopback callbacks. Store only hashes for codes/refresh tokens, enforce one use and rotate refresh tokens transactionally.

```ts
export async function verifyPkce(verifier: string, challenge: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const actual = base64Url(new Uint8Array(digest))
  return timingSafeEqual(actual, challenge)
}
```

- [ ] **Step 4: Run focused Worker tests**

Run: `npm test -- --run src/oauth.test.ts`

Expected: PASS for PKCE, expired code, redirect mismatch, audience mismatch and rotated refresh replay.

- [ ] **Step 5: Commit**

```bash
git add worker/src/oauth.ts worker/src/oauth.test.ts worker/src/env.ts worker/package.json worker/package-lock.json
git commit -m "feat: add MCP OAuth PKCE flow"
```

### Task 3: Replace the MCP baseline with Streamable HTTP and the four read-only tools

**Files:**
- Modify: `worker/src/mcp.ts`
- Create: `worker/src/mcp.test.ts`

**Interfaces:**
- Consumes `validateMcpAccessToken` from `oauth.ts`.
- Produces `mcpResponse(request, env)` and accepts `GET` and `POST` at `/api/mcp`.

- [ ] **Step 1: Write failing tool-contract tests**

```ts
it('lists exactly the four supported read-only tools', async () => {
  const response = await mcpResponse(jsonRpc('tools/list'), env)
  expect(toolNames(response)).toEqual(['search_resources', 'get_resource', 'list_by_kind', 'recommend_for_project'])
  expect(toolAnnotations(response)).toEqual(expect.arrayContaining([expect.objectContaining({ readOnlyHint: true })]))
})
```

- [ ] **Step 2: Run the focused test before implementation**

Run: `npm test -- --run src/mcp.test.ts`

Expected: FAIL because the current server exposes `search_catalog` and `get_catalog_item`.

- [ ] **Step 3: Implement protocol and data access**

Accept only JSON-RPC 2.0 requests, require a valid Bearer access token on every MCP request, validate the Origin against the public app origins, and return `401` with the protected-resource metadata reference for absent/invalid tokens. Implement:

```ts
const tools = [
  { name: 'search_resources', annotations: { readOnlyHint: true } },
  { name: 'get_resource', annotations: { readOnlyHint: true } },
  { name: 'list_by_kind', annotations: { readOnlyHint: true } },
  { name: 'recommend_for_project', annotations: { readOnlyHint: true } },
]
```

Search and recommendation use Postgres full-text search plus existing tag/topic metadata; recommendation ranks deterministic matches and explains the matching terms. Limit each response to 10 records, select only published `team` rows, and never expose service-role fields.

- [ ] **Step 4: Run protocol and worker checks**

Run: `npm test -- --run src/mcp.test.ts && npm run check`

Expected: PASS; GET supports the Streamable HTTP read channel, POST returns JSON-RPC results, and unsupported tool calls return JSON-RPC errors.

- [ ] **Step 5: Commit**

```bash
git add worker/src/mcp.ts worker/src/mcp.test.ts
git commit -m "feat: expose read-only remote MCP tools"
```

### Task 4: Route OAuth, consent and MCP traffic through the Worker

**Files:**
- Modify: `worker/src/index.ts`
- Modify: `worker/src/env.ts`
- Modify: `worker/src/index.test.ts`

**Interfaces:**
- Consumes the OAuth and MCP functions from Tasks 2–3.
- Produces `GET /.well-known/oauth-protected-resource`, `GET /.well-known/oauth-authorization-server`, `/api/oauth/*`, `/api/mcp`, and `GET /v1/admin/mcp/status`.

- [ ] **Step 1: Write routing tests**

```ts
it('returns protected-resource metadata before authentication', async () => {
  const response = await worker.fetch(new Request('https://setupvencedor.com.br/.well-known/oauth-protected-resource'), env)
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toMatchObject({ resource: 'https://setupvencedor.com.br/api/mcp' })
})
```

- [ ] **Step 2: Run the test before adding routes**

Run: `npm test -- --run src/index.test.ts`

Expected: FAIL because the current router has no discovery or OAuth routes.

- [ ] **Step 3: Add explicit routes**

Map the two well-known paths, the OAuth authorization, consent, token and registration routes, `GET|POST /api/mcp`, and the admin-only status endpoint. Keep legacy `/mcp` as a `308` redirect to `/api/mcp` during migration. Make `/health` public and preserve every invitation/person route unchanged.

- [ ] **Step 4: Run routing tests and typecheck**

Run: `npm test -- --run src/index.test.ts && npm run check`

Expected: PASS; old invitation routes remain protected and discovery does not require a bearer token.

- [ ] **Step 5: Commit**

```bash
git add worker/src/index.ts worker/src/env.ts worker/src/index.test.ts
git commit -m "feat: route remote MCP OAuth endpoints"
```

### Task 5: Add the authenticated OAuth consent page

**Files:**
- Create: `src/features/auth/McpAuthorizePage.tsx`
- Create: `src/features/auth/McpAuthorizePage.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes a browser session and `POST /api/oauth/consent`.
- Produces an approve/deny flow that redirects only to the validated URI returned by the Worker.

- [ ] **Step 1: Write failing consent-page tests**

```tsx
it('does not display secrets and labels the requested access read-only', async () => {
  render(<McpAuthorizePage session={adminSession} />)
  expect(screen.getByText(/somente leitura/i)).toBeInTheDocument()
  expect(screen.queryByText(/service.role|api key/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused test before implementation**

Run: `npm test -- --run src/features/auth/McpAuthorizePage.test.tsx`

Expected: FAIL because the authorization page does not exist.

- [ ] **Step 3: Implement the page**

Render this page only for `/mcp/autorizar`. Use the existing Supabase session; if missing, preserve the return path through login. Fetch sanitized client name/scopes from the Worker, show approve and deny actions, and use `window.location.assign()` only with the Worker-provided redirect URL.

- [ ] **Step 4: Run focused UI tests**

Run: `npm test -- --run src/features/auth/McpAuthorizePage.test.tsx src/app/App.test.tsx`

Expected: PASS for unauthenticated return path, approval messaging, denial and no secret leakage.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/McpAuthorizePage.tsx src/features/auth/McpAuthorizePage.test.tsx src/app/App.tsx src/styles.css
git commit -m "feat: add MCP OAuth consent page"
```

### Task 6: Build the admin-only MCP control panel

**Files:**
- Create: `src/features/admin/McpControlPanel.tsx`
- Create: `src/features/admin/McpControlPanel.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes `GET /v1/admin/mcp/status` using the same authenticated fetch convention as `PeopleDirectory`.
- Produces endpoint/copy configuration, activation status, tools list, security summary and technical event history for admins only.

- [ ] **Step 1: Write failing panel tests**

```tsx
it('shows the public endpoint and copies a streamable-http configuration', async () => {
  render(<McpControlPanel />)
  expect(await screen.findByText('https://setupvencedor.com.br/api/mcp')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /copiar configuração/i }))
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('streamable-http'))
})
```

- [ ] **Step 2: Run the focused test before implementation**

Run: `npm test -- --run src/features/admin/McpControlPanel.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the panel within Administration**

Place it below access management. Show `Em preparação`, `Aguardando DNS`, `Ativo` or `Atenção necessária`; show no key, token, secret, OAuth code or raw Cloudflare response. Provide separate copy-ready snippets for Codex and Claude that use `setup-agent`, `streamable-http`, and the public endpoint. Render tool descriptions and latest activation events with localized timestamps.

- [ ] **Step 4: Run admin UI tests**

Run: `npm test -- --run src/features/admin/McpControlPanel.test.tsx src/app/App.test.tsx`

Expected: PASS; non-admin users do not see the panel and admins see no credential value.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/McpControlPanel.tsx src/features/admin/McpControlPanel.test.tsx src/app/App.tsx src/styles.css
git commit -m "feat: add MCP administration panel"
```

### Task 7: Add an hourly Cloudflare activation monitor

**Files:**
- Create: `worker/src/domain-monitor.ts`
- Create: `worker/src/domain-monitor.test.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/src/env.ts`
- Modify: `worker/wrangler.jsonc`

**Interfaces:**
- Produces `runDomainActivationCheck(env, now)` returning `{ state, checks, notified }`.
- The Worker `scheduled()` handler calls it once per hourly event.

- [ ] **Step 1: Write failing idempotency tests**

```ts
it('notifies once when every dependency becomes active', async () => {
  const first = await runDomainActivationCheck(activeEnv, new Date('2026-08-13T12:00:00Z'))
  const second = await runDomainActivationCheck(activeEnv, new Date('2026-08-13T13:00:00Z'))
  expect(first.notified).toBe(true)
  expect(second.notified).toBe(false)
})
```

- [ ] **Step 2: Run the focused monitor test before implementation**

Run: `npm test -- --run src/domain-monitor.test.ts`

Expected: FAIL because the monitor module is absent.

- [ ] **Step 3: Implement checks and event writes**

Use Worker-only identifiers and a narrowly scoped Cloudflare monitoring token to check zone/Pages status. Use the existing Resend secret to query the created domain. Fetch `https://setupvencedor.com.br/api/health` only after the Pages/domain check is active. Persist a sanitized event payload; when all checks first pass, send one Resend notification to `MCP_STATUS_NOTIFICATION_TO` and mark the event key complete.

```json
{
  "triggers": { "crons": ["0 * * * *"] }
}
```

- [ ] **Step 4: Run monitor tests and Worker dry run**

Run: `npm test -- --run src/domain-monitor.test.ts && npm run check`

Expected: PASS; failed checks create status events, a later success notifies exactly once, and the cron is recognized by Wrangler.

- [ ] **Step 5: Commit**

```bash
git add worker/src/domain-monitor.ts worker/src/domain-monitor.test.ts worker/src/index.ts worker/src/env.ts worker/wrangler.jsonc
git commit -m "feat: monitor MCP domain activation hourly"
```

### Task 8: Configure Cloudflare, deploy, and verify end-to-end

**Files:**
- Modify: `worker/wrangler.jsonc` only if deployment validation reveals an incompatible route/trigger configuration.

**Interfaces:**
- Consumes all prior code plus worker secrets set interactively.
- Produces a deployed Worker at `setupvencedor.com.br/api/mcp`, a configured Pages custom domain, a verified Resend sender and a live admin MCP panel.

- [ ] **Step 1: Run all automated checks**

Run: `npm test && npm run build && npm --prefix worker test && npm --prefix worker run check`

Expected: all tests pass, Pages build succeeds and Worker dry-run validates.

- [ ] **Step 2: Configure interactive secrets without logging them**

Run each command interactively from `worker/`:

```bash
npx wrangler secret put MCP_OAUTH_SIGNING_KEY
npx wrangler secret put MCP_PUBLIC_ORIGIN
npx wrangler secret put MCP_STATUS_NOTIFICATION_TO
npx wrangler secret put EMAIL_FROM
```

Set `APP_URL` to `https://setupvencedor.com.br`; configure the Worker routes for `setupvencedor.com.br/api/*` and `setupvencedor.com.br/.well-known/*`; do not commit secret values.

- [ ] **Step 3: Deploy Worker and Pages**

Run: `npx wrangler deploy` from `worker/`, then `npm run build` and `npx wrangler pages deploy dist --project-name setup-vencedor --branch main` from repository root.

Expected: a successful Worker and Pages deployment with the existing app preserved.

- [ ] **Step 4: Run real HTTP and OAuth smoke checks**

Verify:

```text
GET  https://setupvencedor.com.br/.well-known/oauth-protected-resource -> 200
POST https://setupvencedor.com.br/api/mcp without bearer             -> 401 + OAuth discovery
GET  https://setupvencedor.com.br/api/health                         -> 200 {"ok":true}
GET  https://setupvencedor.com.br                                   -> Pages application
```

Complete one browser OAuth consent flow using an admin account, list tools from a remote MCP client, execute one tool call for each of the four read-only tools, and visually verify the Administration MCP module at desktop and mobile widths.

- [ ] **Step 5: Commit and report**

```bash
git add worker/wrangler.jsonc
git commit -m "chore: configure remote MCP deployment"
git status --short
```

Report separately: confirmed active, pending external DNS/Resend propagation, and any user-owned credential/domain setting still required.
