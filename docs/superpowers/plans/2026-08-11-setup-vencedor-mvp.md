# Setup Vencedor MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a primeira versão privada do Setup Vencedor, com convite, múltiplos papéis, catálogo, favoritos, busca sem IA, suporte e MCP somente leitura.

**Architecture:** Um frontend React/Vite hospedado no Cloudflare Pages consome Supabase por meio de RLS. Um Cloudflare Worker separado concentra operações privilegiadas, Resend e MCP. O frontend nunca recebe chave de serviço, segredo Resend ou token de convite legível.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, Playwright, Supabase Auth/Postgres, Cloudflare Pages, Cloudflare Workers, Wrangler, Resend, Zod.

## Global Constraints

- Publicar o frontend no Cloudflare Pages e o Worker em projeto separado.
- Usar o projeto Supabase `lroqtkfxkagkmbwuqqzk` somente após confirmar URL, chaves públicas e ambiente no arquivo local de segredos.
- Nunca ler, exibir, versionar ou usar `Chaves.txt` como código-fonte; transferir valores manualmente para segredos locais/deploy.
- RLS habilitado em cada tabela exposta em `public`; `service_role` somente no Worker.
- Sem cadastro público, sem vídeos/aulas, sem IA generativa e sem escrita pelo MCP nesta versão.
- Papéis cumulativos: `admin`, `manager`, `editor`, `member`.
- Não copiar conteúdo editorial de terceiros; cadastrar fonte oficial e texto próprio.
- Usar PowerShell em comandos Windows e confirmar a documentação atual de Supabase e Cloudflare antes de alterações de infraestrutura.

---

## Estrutura de arquivos planejada

```text
src/
  app/                 rotas, providers e shell autenticado
  components/          UI reutilizável e acessível
  features/auth/       login, ativação e recuperação
  features/catalog/    explorar, filtros, busca e favoritos
  features/admin/      equipe, prévia, catálogo e métricas
  features/support/    abertura, conversa e painel de atendimento
  lib/                 Supabase, autorização, validação e utilitários
worker/
  src/                 API de convites, e-mail e MCP
supabase/migrations/   esquema, RLS, índices e funções invocadoras
tests/                 Vitest e Playwright por fluxo crítico
```

### Task 1: Inicializar frontend, Worker e testes

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/styles.css`
- Create: `worker/package.json`, `worker/wrangler.jsonc`, `worker/src/index.ts`
- Create: `.env.example`, `worker/.dev.vars.example`, `vitest.config.ts`, `playwright.config.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `App`, `createSupabaseBrowserClient`, build `npm run build`, Worker `npm run worker:check`.

- [ ] **Step 1: Criar o teste de shell autenticado**

```tsx
it('renders the protected application shell after a session is supplied', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Executar o teste para confirmar a falha**

Run: `npm run test -- src/app/App.test.tsx`

Expected: FAIL because `App` does not exist.

- [ ] **Step 3: Criar o projeto e configurações mínimas**

Use Vite React TypeScript. Adicione scripts `dev`, `build`, `test`, `test:watch`, `test:e2e`, `lint`, `typecheck`, `worker:dev`, `worker:check`. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como únicas variáveis expostas ao navegador. Configure `wrangler.jsonc` com `main: "src/index.ts"`, `compatibility_date` consultada na documentação atual e nenhum segredo em arquivo versionado.

- [ ] **Step 4: Implementar o shell mínimo e o Worker healthcheck**

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === '/health') return Response.json({ ok: true })
    return Response.json({ error: 'not_found' }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
```

- [ ] **Step 5: Verificar e commitar**

Run: `npm run typecheck; npm run test -- src/app/App.test.tsx; npm run build; npm run worker:check`

Expected: PASS.

```powershell
git add package.json vite.config.ts tsconfig.json tailwind.config.ts src worker .env.example vitest.config.ts playwright.config.ts
git commit -m "feat: bootstrap setup vencedor applications"
```

### Task 2: Criar esquema de identidade, papéis e auditoria

**Files:**
- Create: `supabase/migrations/<generated>_identity_roles_audit.sql`
- Create: `src/lib/roles.ts`, `src/lib/roles.test.ts`
- Create: `supabase/tests/identity_roles.sql`

**Interfaces:**
- Produces: tipo `Role`, função `hasAnyRole(roles: Role[], required: Role[]): boolean`, tabelas `profiles`, `user_roles`, `invitations`, `audit_events`.

- [ ] **Step 1: Escrever testes de papel e RLS**

```ts
expect(hasAnyRole(['member', 'editor'], ['manager', 'editor'])).toBe(true)
expect(hasAnyRole(['member'], ['admin'])).toBe(false)
```

```sql
-- Com auth.uid() = member_a, uma consulta a profiles deve retornar member_a e nunca member_b.
select is((select count(*) from public.profiles), 1, 'member reads only its profile');
```

- [ ] **Step 2: Executar os testes para confirmar a falha**

Run: `npm run test -- src/lib/roles.test.ts`

Expected: FAIL because `hasAnyRole` does not exist.

- [ ] **Step 3: Gerar migration e implementar o núcleo de autorização**

Run: `npx supabase migration new identity_roles_audit`

Na migration, crie enum `app_role`, `profiles`, `user_roles`, `invitations` e `audit_events`; use chaves estrangeiras para `auth.users`; habilite RLS; crie `public.has_role(required app_role)` como `SECURITY INVOKER`; conceda somente o mínimo necessário às funções. Implemente políticas de perfil próprio e políticas explícitas para admin/manager. Hash do token de convite deve ser `sha256`, nunca texto puro.

- [ ] **Step 4: Implementar utilitário de papel e testes SQL locais**

```ts
export type Role = 'admin' | 'manager' | 'editor' | 'member'
export function hasAnyRole(roles: Role[], required: Role[]) {
  return required.some((role) => roles.includes(role))
}
```

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/lib/roles.test.ts; npx supabase db lint; npx supabase migration list --local`

Expected: PASS and no security-advisor regression.

```powershell
git add supabase/migrations supabase/tests src/lib/roles.ts src/lib/roles.test.ts
git commit -m "feat: add identity roles and audit schema"
```

### Task 3: Modelar catálogo, favoritos e busca explicável

**Files:**
- Create: `supabase/migrations/<generated>_catalog_search.sql`
- Create: `src/features/catalog/types.ts`, `src/features/catalog/search.ts`, `src/features/catalog/search.test.ts`
- Create: `supabase/tests/catalog_rls.sql`

**Interfaces:**
- Consumes: `Role`, `profiles`, `has_role`.
- Produces: `CatalogItem`, `SearchResult`, `searchCatalog(query: string, filters: CatalogFilters): Promise<SearchResult[]>`.

- [ ] **Step 1: Escrever testes de normalização e explicação de resultado**

```ts
expect(buildSearchTerms('site bonito UI')).toEqual(['site', 'bonito', 'ui', 'frontend', 'layout'])
expect(explainMatch(['ui', 'frontend'], ['frontend'])).toBe('Encontrado por: frontend')
```

- [ ] **Step 2: Executar o teste para confirmar a falha**

Run: `npm run test -- src/features/catalog/search.test.ts`

Expected: FAIL because search helpers do not exist.

- [ ] **Step 3: Criar migration de catálogo e RLS**

Run: `npx supabase migration new catalog_search`

Crie `categories`, `topics`, `tags`, `catalog_items`, `catalog_item_tags` e `favorites`. Adicione índice GIN de busca em título, resumo e conteúdo próprio. Garanta `unique(user_id, catalog_item_id)` em favoritos. Membro lê somente itens `published`; editor edita itens próprios; manager/admin gerenciam todos; cada usuário lê e altera somente seus favoritos.

- [ ] **Step 4: Implementar busca determinística**

```ts
export type SearchResult = CatalogItem & { reasons: string[]; score: number }
export function buildSearchTerms(query: string): string[] {
  const aliases: Record<string, string[]> = { ui: ['frontend', 'layout'], layout: ['frontend', 'ui'] }
  return [...new Set(query.toLocaleLowerCase('pt-BR').split(/\s+/).flatMap((term) => [term, ...(aliases[term] ?? [])]))]
}
```

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/catalog/search.test.ts; npx supabase db lint`

Expected: PASS.

```powershell
git add supabase/migrations supabase/tests src/features/catalog
git commit -m "feat: add catalog favorites and deterministic search"
```

### Task 4: Modelar suporte e políticas de isolamento

**Files:**
- Create: `supabase/migrations/<generated>_support.sql`
- Create: `src/features/support/types.ts`, `src/features/support/status.ts`, `src/features/support/status.test.ts`
- Create: `supabase/tests/support_rls.sql`

**Interfaces:**
- Produces: `TicketStatus`, `canTransitionTicket(status, next, actorRoles)`, tabelas de ticket, mensagem, nota interna e evento.

- [ ] **Step 1: Escrever testes de transição**

```ts
expect(canTransitionTicket('open', 'answered', ['manager'])).toBe(true)
expect(canTransitionTicket('open', 'finalized', ['member'])).toBe(false)
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run test -- src/features/support/status.test.ts`

Expected: FAIL because `canTransitionTicket` does not exist.

- [ ] **Step 3: Criar migration e políticas**

Run: `npx supabase migration new support`

Crie `support_tickets`, `support_messages`, `support_internal_notes`, `support_events`. Aplique RLS para solicitante ler/criar apenas os próprios tickets e mensagens públicas; manager/admin leem e respondem todos; notas internas jamais são selecionáveis por member/editor. Crie trigger que atualiza `last_activity_at` e registra evento de alteração de status.

- [ ] **Step 4: Implementar máquina de estados**

```ts
const transitions = { open: ['answered', 'closed'], answered: ['closed'], closed: ['open', 'finalized'], finalized: [] } as const
export function canTransitionTicket(status: TicketStatus, next: TicketStatus, roles: Role[]) {
  return hasAnyRole(roles, ['admin', 'manager']) && transitions[status].includes(next as never)
}
```

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/support/status.test.ts; npx supabase db lint`

Expected: PASS and member isolation assertions pass.

```powershell
git add supabase/migrations supabase/tests src/features/support
git commit -m "feat: add isolated support ticket workflow"
```

### Task 5: Implementar autenticação, ativação e recuperação de senha

**Files:**
- Create: `src/features/auth/LoginPage.tsx`, `ActivateInvitePage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
- Create: `src/features/auth/auth.schemas.ts`, `src/features/auth/auth.test.tsx`
- Create: `src/lib/supabase/client.ts`, `src/lib/api/worker.ts`

**Interfaces:**
- Consumes: Worker endpoints `/v1/invitations/activate`, `/v1/invitations/validate`.
- Produces: `activateInvite(input: { token: string; password: string }): Promise<void>`.

- [ ] **Step 1: Escrever testes de formulário**

```tsx
await user.type(screen.getByLabelText('Nova senha'), 'curta')
expect(await screen.findByText('Use pelo menos 12 caracteres.')).toBeVisible()
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run test -- src/features/auth/auth.test.tsx`

Expected: FAIL because the activation page does not exist.

- [ ] **Step 3: Implementar validação e telas**

Use Zod para e-mail, token e senha com no mínimo 12 caracteres. A página de ativação valida o token no Worker, exibe e-mail somente leitura e envia senha pelo endpoint protegido. Login usa `signInWithPassword`; recuperação usa `resetPasswordForEmail` com `redirectTo` da página de redefinição; troca final usa sessão de recovery e `updateUser`.

- [ ] **Step 4: Implementar estados acessíveis**

Todos os formulários terão `aria-live` para erro/sucesso, botão desabilitado durante envio, foco no primeiro erro e modal nunca oculto atrás do cabeçalho.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/auth/auth.test.tsx; npm run typecheck`

Expected: PASS.

```powershell
git add src/features/auth src/lib/supabase src/lib/api
git commit -m "feat: add invite activation login and password recovery"
```

### Task 6: Implementar Worker de convite, auditoria e Resend

**Files:**
- Create: `worker/src/env.ts`, `worker/src/router.ts`, `worker/src/invitations.ts`, `worker/src/resend.ts`, `worker/src/auth.ts`
- Create: `worker/test/invitations.test.ts`
- Modify: `worker/src/index.ts`, `worker/wrangler.jsonc`, `worker/.dev.vars.example`

**Interfaces:**
- Produces: `POST /v1/invitations`, `POST /v1/invitations/validate`, `POST /v1/invitations/activate`, `POST /v1/invitations/:id/revoke`.

- [ ] **Step 1: Escrever teste de token único**

```ts
const invitation = await createInvitation({ email: 'dev@example.com', roles: ['member'] })
await expect(activateInvitation({ token: invitation.token, password: 'Senha-segura-123' })).resolves.toBeUndefined()
await expect(activateInvitation({ token: invitation.token, password: 'Senha-segura-123' })).rejects.toMatchObject({ code: 'invite_used' })
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run worker:test -- worker/test/invitations.test.ts`

Expected: FAIL because invitation services do not exist.

- [ ] **Step 3: Implementar autenticação de rota e convites**

Valide JWT Supabase no Worker. Exija `admin` para criar/revogar convite. Normalize e-mail, use `crypto.getRandomValues`, armazene somente SHA-256 do token, use expiração de 72 horas e consuma atomicamente o convite antes de criar/ativar usuário. Grave `audit_events` em criação, revogação e aceitação. Retorne mensagens genéricas para token inválido/expirado/usado.

- [ ] **Step 4: Implementar e-mail Resend e limite de taxa**

```ts
await resend.emails.send({ from: env.EMAIL_FROM, to: email, subject: 'Seu acesso ao Setup Vencedor', html: inviteEmail({ activationUrl, recipientName }) })
```

Configure `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` como segredos. Não ative envio de produção até domínio/remetente verificados. Limite por IP e por e-mail deve bloquear repetição sem persistir senha ou token.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run worker:test -- worker/test/invitations.test.ts; npm run worker:check`

Expected: PASS.

```powershell
git add worker
git commit -m "feat: add secure invitation worker and email delivery"
```

### Task 7: Construir biblioteca, busca e favoritos

**Files:**
- Create: `src/features/catalog/ExplorePage.tsx`, `AssistantPage.tsx`, `FavoritesPage.tsx`, `CatalogCard.tsx`, `CatalogFilters.tsx`, `FavoriteButton.tsx`
- Create: `src/features/catalog/catalog.queries.ts`, `src/features/catalog/catalog.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `searchCatalog`, `CatalogItem`, tabela `favorites`.
- Produces: rotas `/explorar`, `/assistente`, `/favoritos`.

- [ ] **Step 1: Escrever teste de favorito isolado e resultado explicável**

```tsx
await user.click(screen.getByRole('button', { name: 'Favoritar Frontend Design' }))
expect(mockInsertFavorite).toHaveBeenCalledWith({ catalog_item_id: 'frontend-design' })
expect(screen.getByText('Encontrado por: frontend')).toBeVisible()
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run test -- src/features/catalog/catalog.test.tsx`

Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implementar listagem, filtros e favoritos**

Mantenha filtros em URL (`type`, `topic`, `tag`, `sort`). Use consultas paginadas e mostre o total separadamente das linhas. `FavoriteButton` faz upsert/delete otimista e reverte em erro. `FavoritesPage` consulta pelo usuário atual, nunca por ID recebido da URL.

- [ ] **Step 4: Implementar assistente determinístico**

O formulário envia texto para `searchCatalog`, exibe score e `reasons`, não usa API de modelo e mostra estado "Nenhum item encontrado" com filtros sugeridos. Links externos abrem com `rel="noreferrer"` e URL validada.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/catalog/catalog.test.tsx; npm run build`

Expected: PASS.

```powershell
git add src/features/catalog src/app/App.tsx
git commit -m "feat: add searchable catalog and favorites"
```

### Task 8: Construir painel de administração e prévia de papéis

**Files:**
- Create: `src/features/admin/TeamPage.tsx`, `CatalogAdminPage.tsx`, `RolePreview.tsx`, `InviteModal.tsx`, `AdminDashboard.tsx`
- Create: `src/features/admin/admin.queries.ts`, `src/features/admin/admin.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: Worker invite endpoints, `hasAnyRole`, catálogo e auditoria.
- Produces: rotas `/admin`, `/admin/equipe`, `/admin/catalogo`.

- [ ] **Step 1: Escrever teste de múltiplos papéis e prévia**

```tsx
render(<RolePreview currentRoles={['admin', 'editor']} />)
await user.selectOptions(screen.getByLabelText('Visualizar como'), 'member')
expect(screen.queryByRole('link', { name: 'Administração' })).not.toBeInTheDocument()
expect(screen.getByText('Prévia de Membro ativa')).toBeVisible()
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run test -- src/features/admin/admin.test.tsx`

Expected: FAIL because administration components do not exist.

- [ ] **Step 3: Implementar equipe, convite e prévia**

AdminDashboard mostra totais exatos de equipe, convites pendentes, itens publicados e chamados abertos. InviteModal chama Worker e nunca envia papéis sem validar. A prévia é estado local e não altera `user_roles`; a faixa fixa mostra papel ativo e botão "Sair da prévia".

- [ ] **Step 4: Implementar CRUD de catálogo**

Use formulários validados para rascunho, publicação e arquivamento. Exija URL oficial `https`, resumo próprio e categoria. Editor só recebe ações permitidas pela política do banco; a UI não é a única barreira.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/admin/admin.test.tsx; npm run typecheck`

Expected: PASS.

```powershell
git add src/features/admin src/app/App.tsx
git commit -m "feat: add team catalog administration and role preview"
```

### Task 9: Construir suporte do membro e painel de atendimento

**Files:**
- Create: `src/features/support/SupportPage.tsx`, `TicketForm.tsx`, `TicketThread.tsx`, `SupportAdminPage.tsx`, `StatusTabs.tsx`
- Create: `src/features/support/support.queries.ts`, `src/features/support/support.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `TicketStatus`, tabelas e RLS de suporte.
- Produces: rotas `/suporte` e `/admin/suporte`.

- [ ] **Step 1: Escrever teste de abertura e nota interna**

```tsx
await user.selectOptions(screen.getByLabelText('Tipo'), 'access')
await user.type(screen.getByLabelText('Mensagem'), 'Não consigo entrar com minha senha')
await user.click(screen.getByRole('button', { name: 'Enviar chamado' }))
expect(mockCreateTicket).toHaveBeenCalled()
expect(screen.queryByText('Nota interna')).not.toBeInTheDocument()
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run test -- src/features/support/support.test.tsx`

Expected: FAIL because support pages do not exist.

- [ ] **Step 3: Implementar área do membro**

Inclua tipos `question`, `access`, `bug`, `suggestion`, `other`; liste apenas tickets próprios; permita mensagem pública enquanto ticket não estiver finalizado; mostre status e última atividade.

- [ ] **Step 4: Implementar área de atendimento**

StatusTabs usa os quatro estados aprovados e contadores exatos. Manager/admin podem atribuir responsável, responder, alterar estado e escrever nota interna; cada alteração grava evento. Use filtros por tipo, solicitante e data.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run test -- src/features/support/support.test.tsx; npm run build`

Expected: PASS.

```powershell
git add src/features/support src/app/App.tsx
git commit -m "feat: add member support and operations inbox"
```

### Task 10: Expor MCP remoto somente leitura

**Files:**
- Create: `worker/src/mcp/server.ts`, `worker/src/mcp/tools.ts`, `worker/src/mcp/auth.ts`
- Create: `worker/test/mcp.test.ts`
- Modify: `worker/src/router.ts`, `worker/src/index.ts`, `worker/wrangler.jsonc`

**Interfaces:**
- Produces: ferramentas MCP `search_catalog`, `get_catalog_item`, `list_favorites`.

- [ ] **Step 1: Escrever teste de escopo de leitura**

```ts
const result = await mcp.call('get_catalog_item', { slug: 'draft-only' }, memberToken)
expect(result.isError).toBe(true)
expect(await mcp.call('delete_catalog_item', {}, adminToken)).toMatchObject({ isError: true })
```

- [ ] **Step 2: Executar teste para confirmar falha**

Run: `npm run worker:test -- worker/test/mcp.test.ts`

Expected: FAIL because MCP tools do not exist.

- [ ] **Step 3: Implementar transporte e autenticação compatíveis**

Consulte a documentação atual do protocolo MCP e do cliente Claude antes de fixar transporte. Valide token de usuário em cada chamada e consulte o banco com o contexto de acesso do usuário, não com resultados globais pré-carregados. As ferramentas retornam título, resumo próprio, fonte, instruções e URL de itens acessíveis.

- [ ] **Step 4: Remover qualquer superfície de escrita**

Não registre ferramentas de create/update/delete; rejeite métodos fora do protocolo e registre apenas metadados operacionais sem consulta, token ou conteúdo sensível.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run worker:test -- worker/test/mcp.test.ts; npm run worker:check`

Expected: PASS.

```powershell
git add worker/src/mcp worker/test/mcp.test.ts worker/src/router.ts worker/src/index.ts worker/wrangler.jsonc
git commit -m "feat: add read-only catalog mcp"
```

### Task 11: Validar segurança, fluxo real e publicação

**Files:**
- Create: `tests/e2e/invite-auth.spec.ts`, `tests/e2e/catalog-support.spec.ts`, `docs/deployment.md`
- Modify: `README.md`, `.env.example`, `worker/.dev.vars.example`

**Interfaces:**
- Consumes: todos os fluxos anteriores.
- Produces: checklist de produção e builds implantáveis.

- [ ] **Step 1: Escrever os cenários ponta a ponta**

```ts
test('invite activation grants member access without admin navigation', async ({ page }) => {
  await page.goto(`/ativar?token=${testInviteToken}`)
  await page.getByLabel('Nova senha').fill('Senha-segura-123')
  await page.getByRole('button', { name: 'Criar acesso' }).click()
  await expect(page.getByRole('link', { name: 'Explorar' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Administração' })).toHaveCount(0)
})
```

- [ ] **Step 2: Executar cenários para confirmar falha inicial**

Run: `npm run test:e2e -- tests/e2e/invite-auth.spec.ts`

Expected: FAIL until test environment and flows exist.

- [ ] **Step 3: Configurar ambiente de teste e verificar RLS**

Crie usuários e dados de teste isolados. Execute cenários para convite, e-mail inválido, login, recuperação, papéis, prévia, busca, favoritos, ticket próprio, nota interna e MCP. Rode advisors de banco e revise políticas uma a uma contra o modelo de papéis.

- [ ] **Step 4: Preparar publicação**

Documente variáveis públicas no Pages e segredos no Worker. Configure Preview e Production em projetos separados. Vincule Pages ao repositório com build `npm run build` e diretório `dist`; publique Worker somente após configurar segredos e domínio Resend verificado. Não declare e-mail de produção pronto antes de enviar/receber uma mensagem real de teste.

- [ ] **Step 5: Verificar, revisar e commitar**

Run: `npm run lint; npm run typecheck; npm run test; npm run build; npm run worker:check; npm run test:e2e; npx supabase db lint`

Expected: PASS; erros de RLS, envio de e-mail e deploy documentados separadamente se algum ambiente externo impedir a verificação.

```powershell
git add tests docs README.md .env.example worker/.dev.vars.example
git commit -m "test: verify setup vencedor production flows"
```

## Self-review

- Cobertura da especificação: Tasks 2, 5 e 6 cobrem acesso; Tasks 3 e 7 cobrem catálogo, busca e favoritos; Tasks 4 e 9 cobrem suporte; Task 8 cobre administração e prévia; Task 10 cobre MCP; Task 11 cobre segurança, testes e publicação.
- Não há vídeos, IA generativa, cadastro público ou escrita MCP nas tarefas.
- Os nomes de `Role`, `TicketStatus`, `searchCatalog` e ferramentas MCP são definidos antes de serem consumidos.
- Dependências externas que exigem confirmação atual, API Supabase, transporte MCP, Cloudflare compatibility date e domínio Resend, estão explicitamente verificadas antes de uso, sem segredo no repositório.
