# Invite Directory and Access Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar convites por e-mail e link direto, ambos de uso único, mais gestão pesquisável, reenvio, revogação, bloqueio, reativação e remoção segura de pessoas.

**Architecture:** A página chama somente o Worker autenticado. O Worker é a fronteira administrativa: cria tokens aleatórios, guarda apenas seus hashes no Supabase, usa service role para operações de identidade e envia e-mails por Resend. Migrações mantêm RLS estrito; o browser não ganha acesso a tabelas administrativas nem a segredos.

**Tech Stack:** Cloudflare Worker, Supabase Auth/Postgres/RLS, Resend, React 19, TypeScript, Vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-08-12-knowledge-command-center-and-invites-design.md`

## Global Constraints

- Sem cadastro público: toda conta nasce da aceitação atômica de um convite válido.
- Email invite vincula e-mail; link direto associa o primeiro e-mail informado na ativação.
- Papéis são obrigatórios; nome é opcional somente no link direto.
- Token tem 72 horas, é armazenado somente como SHA-256 e não pode ser aceito duas vezes.
- Apenas administradores podem ver, criar, reenviar, copiar, revogar, bloquear, reativar ou remover.
- Revogar, bloquear e remover precisam gerar evento de auditoria sem token ou senha no payload.
- Nunca expor ou versionar `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` ou `Chaves.txt`.

---

### Task 1: Modelo de convite compatível com e-mail e link direto

**Files:**
- Create: `supabase/migrations/20260812_invite_modes_and_people.sql`
- Modify: `supabase/tests/identity_roles.sql`
- Modify: `worker/src/invitations.ts`
- Modify: `worker/src/invitations.test.ts`

**Interfaces:**
- Produces: tipo SQL `public.invitation_delivery` com valores `email` e `direct_link`.
- Produces: `InvitationMode = 'email' | 'direct_link'` e `validateInviteInput(input)` no Worker.
- `invitations.email_normalized` e `recipient_name` aceitam `null` apenas quando `delivery = 'direct_link'`.

- [ ] **Step 1: Escrever testes que falham para as regras de cada modalidade.**

```ts
it('requires a recipient email for email delivery', () => {
  expect(() => validateInviteInput({ delivery: 'email', recipientName: '', roles: ['member'] })).toThrow('invalid_invitation')
})

it('accepts a direct link without email or recipient name', () => {
  expect(validateInviteInput({ delivery: 'direct_link', roles: ['editor'] })).toMatchObject({ delivery: 'direct_link' })
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha porque a validação não existe.**

Run: `npm --workspace worker test -- --run src/invitations.test.ts`

Expected: FAIL com exportação ausente.

- [ ] **Step 3: Criar migração e validação.**

```sql
create type public.invitation_delivery as enum ('email', 'direct_link');
alter table public.invitations add column delivery public.invitation_delivery not null default 'email';
alter table public.invitations alter column email_normalized drop not null;
alter table public.invitations alter column recipient_name drop not null;
alter table public.invitations add constraint invitations_delivery_identity_check check (
  (delivery = 'email' and email_normalized is not null and recipient_name is not null)
  or (delivery = 'direct_link')
);
```

Atualizar o índice parcial de convite vivo para ignorar e-mail nulo e estender `claim_invitation` para retornar `delivery`.

- [ ] **Step 4: Rodar testes Worker e pgTAP.**

Run: `npm --workspace worker test -- --run src/invitations.test.ts`

Run: `supabase test db --local --file supabase/tests/identity_roles.sql`

Expected: PASS; membro continua sem leitura administrativa e os dois modos obedecem a restrição.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add supabase/migrations/20260812_invite_modes_and_people.sql supabase/tests/identity_roles.sql worker/src/invitations.ts worker/src/invitations.test.ts
git commit -m "feat: add one-time email and direct link invite modes"
```

### Task 2: Endpoints administrativos do Worker

**Files:**
- Modify: `worker/src/index.ts`
- Create: `worker/src/index.test.ts`
- Modify: `worker/src/env.ts`

**Interfaces:**
- Produces:
  - `POST /v1/invitations`;
  - `POST /v1/invitations/:id/resend`;
  - `POST /v1/invitations/:id/revoke`;
  - `GET /v1/admin/people?query=`;
  - `POST /v1/admin/people/:id/access`;
  - `DELETE /v1/admin/people/:id`.
- `POST /v1/invitations` retorna `{ invitation, activationUrl? }`; `activationUrl` só existe para `direct_link`.

- [ ] **Step 1: Escrever testes de autorização, uso único e resposta segura.**

```ts
it('returns a direct activation URL only for a direct-link invitation', async () => {
  const response = await app.fetch(requestAsAdmin('/v1/invitations', { delivery: 'direct_link', roles: ['member'] }), env)
  await expect(response.json()).resolves.toMatchObject({ activationUrl: expect.stringContaining('/ativar?token=') })
})

it('rejects a revoked invitation before account creation', async () => {
  await revokeInvite(invitation.id)
  expect(await activate(invitation.token)).toMatchObject({ error: 'invalid_or_expired_invitation' })
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha porque as rotas não existem.**

Run: `npm --workspace worker test -- --run src/index.test.ts`

Expected: FAIL com `not_found` ou helpers ausentes.

- [ ] **Step 3: Implementar as rotas através de `requireAdmin`.**

```ts
if (request.method === 'POST' && matchInvitationAction(path, 'resend')) {
  const { supabase, userId } = await requireAdmin(request, env)
  const invitation = await findPendingInvitation(match.id, supabase)
  if (invitation.delivery !== 'email') return json({ error: 'email_delivery_required' }, { status: 422 })
  await sendInviteEmail(env, invitation, tokenFromPlaintextStore)
  await audit(supabase, userId, 'invitation.resent', { invitationId: invitation.id })
  return json({ ok: true })
}
```

Não guardar token em claro. Reenvio deve criar um novo token, revogar o pendente anterior e enviar a nova URL. Revogar atualiza estado e auditoria. Bloquear/reativar atualiza `profiles.state`; remover chama `auth.admin.deleteUser`, mantendo o audit event com `target_user_id` nulo quando a FK aplicar `set null`.

- [ ] **Step 4: Rodar os testes Worker.**

Run: `npm --workspace worker test`

Expected: PASS; não-admin recebe 403, link direto não reenvia por e-mail, e token revogado não ativa.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add worker/src/index.ts worker/src/index.test.ts worker/src/env.ts
git commit -m "feat: manage invitation and people access in worker"
```

### Task 3: Ativação adaptável e atomicidade

**Files:**
- Modify: `src/features/auth/ActivateInvitePage.tsx`
- Create: `src/features/auth/ActivateInvitePage.test.tsx`
- Modify: `worker/src/index.ts`
- Modify: `worker/src/index.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- A validação retorna `{ delivery, email?: string, recipientName?: string }`.
- `ActivateInput` passa a aceitar `{ token, password, email?: string, recipientName?: string }`.

- [ ] **Step 1: Escrever testes de campos condicionais.**

```tsx
it('keeps the e-mail read-only for an email invitation', async () => {
  mockValidate({ delivery: 'email', email: 'dev@example.com', recipientName: 'Dev' })
  render(<ActivateInvitePage />)
  expect(await screen.findByDisplayValue('dev@example.com')).toHaveAttribute('readonly')
})

it('asks for name and e-mail only when the direct link has none preset', async () => {
  mockValidate({ delivery: 'direct_link' })
  render(<ActivateInvitePage />)
  expect(await screen.findByLabelText('E-mail')).not.toHaveAttribute('readonly')
  expect(screen.getByLabelText('Nome')).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha porque a resposta atual só tem e-mail.**

Run: `npm test -- --run src/features/auth/ActivateInvitePage.test.tsx`

Expected: FAIL em `Nome` ou `readonly`.

- [ ] **Step 3: Implementar renderização e validação condicional.**

```tsx
const needsEmail = invite.delivery === 'direct_link' && !invite.email
const needsName = invite.delivery === 'direct_link' && !invite.recipientName
```

No Worker, normalizar o e-mail informado antes de chamar `claim_invitation`; a operação deve gravar o e-mail no convite durante a transição `pending → claimed`, de forma que uma segunda requisição não possa trocar a identidade nem criar segunda conta.

- [ ] **Step 4: Rodar testes de ativação e Worker.**

Run: `npm test -- --run src/features/auth/ActivateInvitePage.test.tsx && npm --workspace worker test -- --run src/index.test.ts`

Expected: PASS; a mesma URL direta não pode ativar duas contas.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/auth/ActivateInvitePage.tsx src/features/auth/ActivateInvitePage.test.tsx worker/src/index.ts worker/src/index.test.ts src/styles.css
git commit -m "feat: support conditional direct invite activation"
```

### Task 4: Painel de convites e diretório pesquisável

**Files:**
- Create: `src/features/admin/invites.ts`
- Create: `src/features/admin/InviteComposer.tsx`
- Create: `src/features/admin/PeopleDirectory.tsx`
- Create: `src/features/admin/PeopleDirectory.test.tsx`
- Modify: `src/features/admin/InviteForm.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `InviteComposer({ onCreate })` e `PeopleDirectory({ people, onResend, onRevoke, onAccessChange, onDelete })`.
- Consumes: `AdminPerson` com `id`, `name`, `email`, `roles`, `state`, `invitationState`, `expiresAt` e `delivery`.

- [ ] **Step 1: Escrever os testes de modalidade e busca.**

```tsx
it('does not require email for a direct link', async () => {
  const user = userEvent.setup()
  render(<InviteComposer onCreate={onCreate} />)
  await user.click(screen.getByRole('tab', { name: 'Gerar link direto' }))
  await user.selectOptions(screen.getByLabelText('Papel'), 'editor')
  await user.click(screen.getByRole('button', { name: 'Gerar link de convite' }))
  expect(onCreate).toHaveBeenCalledWith({ delivery: 'direct_link', roles: ['editor'], recipientName: '' })
})

it('filters people by name or email', async () => {
  render(<PeopleDirectory people={people} {...actions} />)
  await userEvent.setup().type(screen.getByLabelText('Buscar pessoas'), 'ana')
  expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  expect(screen.queryByText('Bruno')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha pelos componentes ausentes.**

Run: `npm test -- --run src/features/admin/PeopleDirectory.test.tsx`

Expected: FAIL com módulo não encontrado.

- [ ] **Step 3: Implementar o painel e integrar as chamadas seguras ao Worker.**

```tsx
<InviteComposer onCreate={createInvitation} />
<PeopleDirectory
  people={people}
  onResend={resendInvitation}
  onRevoke={revokeInvitation}
  onAccessChange={setPersonAccess}
  onDelete={deletePerson}
/>
```

O modo e-mail mostra nome, e-mail e papel; o modo link mostra nome opcional e papel. O resultado direto exibe URL com botão Copiar. O diretório possui busca debounced de 250ms e ações com confirmação para revogar, bloquear e remover.

- [ ] **Step 4: Rodar testes do diretório e App.**

Run: `npm test -- --run src/features/admin/PeopleDirectory.test.tsx src/app/App.test.tsx`

Expected: PASS; e-mail não aparece como obrigatório no modo direto e ações disparam o callback correto.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/admin src/app/App.tsx src/styles.css
git commit -m "feat: add searchable invite and people management panel"
```

### Task 5: Garantias de acesso, integração e publicação

**Files:**
- Modify: `supabase/tests/identity_roles.sql`
- Modify: `worker/src/index.test.ts`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Produces: cobertura de convite de uso único, e-mail vinculado, revogação, bloqueio, remoção e proibição para não-admin.

- [ ] **Step 1: Escrever casos de RLS e integração que falham.**

```sql
select throws_ok(
  $$select * from public.invitations$$,
  '42501',
  null,
  'member cannot read invitation records'
);
```

```ts
it('does not return a plaintext invite token from the people directory', async () => {
  expect(await listPeopleAsAdmin()).not.toHaveProperty('token')
})
```

- [ ] **Step 2: Rodar os testes e confirmar a causa das falhas.**

Run: `npm --workspace worker test -- --run src/index.test.ts`

Run: `supabase test db --local --file supabase/tests/identity_roles.sql`

Expected: FAIL somente em regras ainda não implementadas.

- [ ] **Step 3: Aplicar os menores ajustes de migração, Worker ou UI indicados pelos testes.**

```ts
return json({ people: rows.map(({ token_hash: _tokenHash, ...person }) => person) })
```

Nenhuma resposta de listagem inclui `token_hash`, token puro, senha, access token, refresh token ou chave externa.

- [ ] **Step 4: Rodar toda a verificação.**

Run: `npm test && npm --workspace worker test && npm run worker:check && npm run typecheck && npm run build && git diff --check`

Expected: todos os testes, checks e build passam.

- [ ] **Step 5: Aplicar migrações, publicar Worker e Pages, e realizar smoke test autenticado.**

```powershell
supabase db push --linked --include-all
npm --workspace worker run check
npx wrangler deploy --config worker/wrangler.jsonc
npx wrangler pages deploy dist --project-name setup-vencedor --branch main --commit-dirty true
```

Expected: migrações aplicadas, Worker ativo, Pages publicada; testar criação de um convite por e-mail, um link direto, revogação de link pendente e bloqueio de uma conta de teste.
