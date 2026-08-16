# Public Access Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect staging public registration with consent, Turnstile, verified e-mail, strict roles, and lifecycle audit records.

**Architecture:** React sends a Turnstile token with each Supabase Auth action. Supabase Auth validates the token server-side; database triggers create the member profile, record consent and lifecycle events, and never expose privileged credentials to the browser.

**Tech Stack:** React, TypeScript, Vite, Supabase Auth/Postgres/RLS, Cloudflare Turnstile, Cloudflare Pages, Vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-08-15-public-access-security-design.md`

## Global Constraints

- Work only in `C:\Dev\setup-vencedor-staging` and Supabase project `ecjcudvhhymtfuwvmnzv`.
- Do not alter production.
- Never commit or print service keys, SMTP passwords, Turnstile secrets, or access tokens.
- Public registration grants only `member`; invitations remain required for elevated roles.
- Every new `public` table has RLS and no `anon` grant.
- SMTP must be custom and verified before broad public release; default Supabase SMTP remains staging-only.

---

### Task 1: Test and implement public-auth consent and CAPTCHA contract

**Files:**
- Modify: `src/features/auth/PublicAccessPage.tsx`
- Modify: `src/features/auth/PublicAccessPage.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:** `PublicAccessSubmission` includes `captchaToken`, `termsAccepted: true`, and `termsVersion: '2026-08-15'`; login, signup and recovery callbacks all receive `captchaToken`.

- [ ] **Step 1: Write failing tests**

```tsx
expect(screen.getByText(/aceite os termos/i)).toBeInTheDocument()
expect(onLogin).toHaveBeenCalledWith('ana@example.com', 'senha123', 'verified-token')
```

- [ ] **Step 2: Run red tests**

Run: `npm test -- src/features/auth/PublicAccessPage.test.tsx src/app/App.test.tsx`

Expected: FAIL because consent and CAPTCHA data do not exist.

- [ ] **Step 3: Add the minimal typed UI and Auth calls**

Render mandatory consent in signup mode; block submission without it or a token. Pass `options.captchaToken` to `signUp`, `signInWithPassword`, and `resetPasswordForEmail`; store consent version in signup `data` only.

- [ ] **Step 4: Run green tests and commit**

Run: `npm test -- src/features/auth/PublicAccessPage.test.tsx src/app/App.test.tsx`

Commit: `git commit -am "feat: require consent and captcha for public auth"`

### Task 2: Add an explicit-rendered Turnstile component

**Files:**
- Create: `src/features/auth/TurnstileChallenge.tsx`
- Create: `src/features/auth/TurnstileChallenge.test.tsx`
- Modify: `src/features/auth/PublicAccessPage.tsx`
- Modify: `src/vite-env.d.ts`
- Modify: `.env.example`

**Interfaces:** `TurnstileChallenge({ action, onTokenChange })` uses only `VITE_TURNSTILE_SITE_KEY`, returns a token on success, and clears it on expiry/error.

- [ ] **Step 1: Write red component tests**

```tsx
expect(render(<TurnstileChallenge action="signup" onTokenChange={vi.fn()} />).container).toBeEmptyDOMElement()
```

- [ ] **Step 2: Run red test**

Run: `npm test -- src/features/auth/TurnstileChallenge.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement and test green**

Load Cloudflare's explicit widget script once, use `signup`, `login`, and `recovery` actions, and never put its secret in source. Run `npm test -- src/features/auth/TurnstileChallenge.test.tsx src/features/auth/PublicAccessPage.test.tsx`.

- [ ] **Step 4: Commit**

Commit: `git commit -am "feat: add Turnstile challenge to public auth"`

### Task 3: Record consent and lifecycle events in the database

**Files:**
- Create: generated `supabase/migrations/*_public_access_consent_audit.sql`
- Create: `supabase/tests/public_access_security.sql`

**Interfaces:** `legal_acceptances(user_id, document_key, document_version, accepted_at)` is written only by the Auth trigger. `audit_events` gains `public_signup.created` and `public_signup.confirmed` events with no secret payloads.

- [ ] **Step 1: Create migration and failing pgTAP test**

Run: `npx supabase migration new public_access_consent_audit`

Test a confirmed metadata-bearing signup, ownership-only consent reads, and rejected member audit writes.

- [ ] **Step 2: Run red database test**

Run: `npx supabase test db --linked --file supabase/tests/public_access_security.sql`

Expected: FAIL because the table/policies do not exist.

- [ ] **Step 3: Add minimum RLS-safe migration**

Create the table with RLS, revoke `anon`, grant authenticated `select` only with `(select auth.uid()) = user_id`, and update the existing security-definer Auth triggers to record consent and audit events internally. Do not change invitation role behavior.

- [ ] **Step 4: Push and verify, then commit**

Run: `npx supabase db push --linked --include-all` and `npx supabase migration list --linked`.

Commit: `git commit -am "feat: audit public signup consent"`

### Task 4: Provision Turnstile and enable Supabase Auth protection in staging

**Files:**
- Modify: `supabase/config.toml` only for non-secret rate/redirect settings
- Modify: `docs/superpowers/specs/2026-08-15-public-access-security-design.md`

- [ ] **Step 1: Probe Cloudflare and create the widget**

Use the Turnstile wizard for `localhost`, `127.0.0.1`, and `setup-vencedor-staging.pages.dev`. Keep the secret only in process memory.

- [ ] **Step 2: Set Supabase Bot and Abuse Protection**

Enable Turnstile in the staging Auth dashboard/API with the secret, preserve email confirmation and staging redirect URLs, and set conservative signup/sign-in and email resend limits.

- [ ] **Step 3: Validate the server-side rejection**

Confirm an Auth request without a CAPTCHA token is rejected; then inspect the real widget on the staging page. Do not create unnecessary user accounts.

### Task 5: Build, deploy, and capture the SMTP boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-08-15-public-access-security-design.md`

- [ ] **Step 1: Run release checks**

Run: `npm test`, `npm run typecheck`, `npm run build`, `npm --workspace worker run check`, and `npm --workspace worker run test`.

- [ ] **Step 2: Deploy staging only**

Run: `npx wrangler pages deploy dist --project-name setup-vencedor-staging --branch staging --commit-dirty=true`.

- [ ] **Step 3: Browser verification and commit**

Verify consent, Turnstile and no public elevation path on staging. Record custom SMTP as the remaining launch gate if it is not configured, then commit the validation note.
