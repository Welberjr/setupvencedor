# Catalog Command Center Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar descoberta, detalhe, suporte e PWA uma experiência compacta, legível e com identidade própria.

**Architecture:** `App.tsx` permanece responsável pela sessão e dados. Componentes de catálogo, marca, suporte e PWA recebem responsabilidades de apresentação; funções puras guardam narrativa, capacidade de paginação e sanitização. CSS nativo mantém os tokens e breakpoints sem nova biblioteca de UI.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, CSS nativo, Supabase.

**Spec:** `docs/superpowers/specs/2026-08-12-knowledge-command-center-and-invites-design.md`

## Global Constraints

- Preservar catálogo real, links públicos, favoritos, autenticação privada e RLS.
- Não copiar textos de terceiros nem usar IA generativa no navegador.
- Todo texto novo é UTF-8 em português do Brasil revisado.
- Cards não exibem tags; contexto e tags ficam no detalhe.
- Páginas não finais preenchem a matriz de cards de seu breakpoint.
- PWA usa o prompt nativo quando houver e orientação dispensável quando não houver.

---

### Task 1: Narrativa curta, variada e estruturada

**Files:**
- Modify: `src/features/catalog/catalog-narrative.ts`
- Modify: `src/features/catalog/catalog-narrative.test.ts`
- Modify: `src/features/catalog/types.ts`

**Interfaces:**
- Produces: `CatalogNarrative` com `firstSteps: string[]` e `teamUse: string`.
- Produces: `createCardSummary(item): string` com no máximo duas frases.

- [ ] **Step 1: Escrever os testes que falham.**

```ts
it('uses concise Portuguese copy without the repeated public-reference phrase', () => {
  const summary = createCardSummary({ ...item, type: 'Ferramenta', title: 'Open Higgsfield AI' })
  expect(summary).toMatch(/execução|decisão/i)
  expect(summary).not.toMatch(/Referência pública para a equipe avaliar/i)
  expect(summary.split('. ').length).toBeLessThanOrEqual(2)
})

it('returns the first action as individual ordered steps', () => {
  expect(createCatalogNarrative(item).firstSteps).toHaveLength(3)
})
```

- [ ] **Step 2: Rodar o teste focalizado e confirmar falha.**

Run: `npm test -- --run src/features/catalog/catalog-narrative.test.ts`

Expected: FAIL porque `firstSteps` não existe e o resumo ainda usa cópia repetitiva.

- [ ] **Step 3: Implementar a menor narrativa baseada no conteúdo do item.**

```ts
export type CatalogNarrative = {
  whatItIs: string
  whenToUse: string
  firstSteps: string[]
  teamUse: string
  impact: string
}

export function createCardSummary(item: CatalogItem): string {
  return `${firstReadableSentence(item.summary) ?? fallbackForType(item)} ${specificOutcome(item)}.`
}
```

Usar a primeira frase legível de `summary`; a alternativa usa título e tipo real. Corrigir as frases estáticas para “execução”, “decisão”, “consistência”, “automação” e “referência”.

- [ ] **Step 4: Rodar o teste e confirmar passagem.**

Run: `npm test -- --run src/features/catalog/catalog-narrative.test.ts`

Expected: PASS.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/catalog/catalog-narrative.ts src/features/catalog/catalog-narrative.test.ts src/features/catalog/types.ts
git commit -m "feat: refine catalog narrative copy"
```

### Task 2: Marca SV e ícones desenhados no projeto

**Files:**
- Create: `src/features/brand/BrandMark.tsx`
- Create: `src/features/brand/CommandIcon.tsx`
- Create: `src/features/brand/BrandMark.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/features/catalog/CatalogDetailPanel.tsx`
- Modify: `src/features/catalog/CatalogPagination.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `BrandMark({ compact?: boolean })` e `CommandIcon({ name, size? })`.
- `name` aceita `explore`, `assistant`, `favorites`, `support`, `admin`, `close`, `previous`, `next` e `arrow`.

- [ ] **Step 1: Escrever os testes que falham para o monograma e a seta curva.**

```tsx
it('renders the custom SV monogram with a product label', () => {
  render(<BrandMark />)
  expect(screen.getByLabelText('Setup Vencedor')).toBeInTheDocument()
})

it('renders the handmade curved arrow', () => {
  render(<CommandIcon name="arrow" />)
  expect(screen.getByTestId('command-icon-arrow')).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha pelos módulos ausentes.**

Run: `npm test -- --run src/features/brand/BrandMark.test.tsx`

Expected: FAIL com módulo não encontrado.

- [ ] **Step 3: Implementar SVGs estáticos e substituir os ícones genéricos.**

```tsx
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <svg aria-label="Setup Vencedor" role="img" viewBox="0 0 48 48">...</svg>
}

export function CommandIcon({ name, size = 18 }: { name: CommandIconName; size?: number }) {
  return <svg aria-hidden="true" data-testid={`command-icon-${name}`} height={size} viewBox="0 0 24 24" width={size}>...</svg>
}
```

Usar paths próprios com pontas arredondadas. O monograma reúne S e V em dois planos; a ação “Ver detalhes” usa o ícone `arrow`, que termina em curva.

- [ ] **Step 4: Rodar teste e typecheck.**

Run: `npm test -- --run src/features/brand/BrandMark.test.tsx && npm run typecheck`

Expected: PASS sem erros TypeScript.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/brand src/app/App.tsx src/features/catalog/CatalogDetailPanel.tsx src/features/catalog/CatalogPagination.tsx src/styles.css
git commit -m "feat: add custom command center brand icons"
```

### Task 3: Paginação que completa a grade

**Files:**
- Create: `src/features/catalog/useCatalogPageSize.ts`
- Create: `src/features/catalog/useCatalogPageSize.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `getCatalogPageSize(width: number): number` e `useCatalogPageSize(): number`.
- Capacidades: 20 para cinco colunas, 16 para quatro, 12 para três, 8 para duas e 6 para uma.

- [ ] **Step 1: Escrever os testes de capacidade.**

```ts
it.each([[1600, 20], [1260, 16], [960, 12], [640, 8], [390, 6]])(
  'uses %i px to select a complete page of %i cards',
  (width, expected) => expect(getCatalogPageSize(width)).toBe(expected),
)
```

- [ ] **Step 2: Rodar o teste e confirmar falha pela exportação ausente.**

Run: `npm test -- --run src/features/catalog/useCatalogPageSize.test.ts`

Expected: FAIL com `getCatalogPageSize` ausente.

- [ ] **Step 3: Implementar a tabela de breakpoints e integrá-la ao `getPageWindow`.**

```ts
export function getCatalogPageSize(width: number): number {
  if (width >= 1500) return 20
  if (width >= 1180) return 16
  if (width >= 880) return 12
  if (width >= 560) return 8
  return 6
}
```

O hook escuta resize e `App.tsx` passa seu retorno como terceiro argumento de `getPageWindow`. Remover a linha de tags dos cards e reduzir sua altura mínima sem esconder ações.

- [ ] **Step 4: Rodar testes de paginação e App.**

Run: `npm test -- --run src/features/catalog/pagination.test.ts src/features/catalog/useCatalogPageSize.test.ts src/app/App.test.tsx`

Expected: PASS; uma página desktop não final contém 20 cards.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/catalog/useCatalogPageSize.ts src/features/catalog/useCatalogPageSize.test.ts src/app/App.tsx src/styles.css
git commit -m "feat: fill catalog pages by responsive capacity"
```

### Task 4: Detalhe organizado e visualmente destacável

**Files:**
- Create: `src/features/catalog/FirstSteps.tsx`
- Create: `src/features/catalog/FirstSteps.test.tsx`
- Modify: `src/features/catalog/CatalogDetailPanel.tsx`
- Create: `src/features/catalog/CatalogDetailPanel.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `FirstSteps({ steps: string[] })` com `<ol>` e `<li>`.
- `CatalogDetailPanel` consome `narrative.firstSteps` e `narrative.teamUse`.

- [ ] **Step 1: Escrever o teste de lista ordenada.**

```tsx
it('renders every first step in a separate numbered list item', () => {
  render(<FirstSteps steps={['Abrir a fonte', 'Validar no projeto', 'Registrar o padrão']} />)
  expect(screen.getByRole('list')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha pelo componente ausente.**

Run: `npm test -- --run src/features/catalog/FirstSteps.test.tsx`

Expected: FAIL com módulo não encontrado.

- [ ] **Step 3: Implementar a lista e os blocos de leitura.**

```tsx
<article className="detail-block detail-block-steps">
  <p className="detail-kicker">Primeiro passo</p>
  <FirstSteps steps={narrative.firstSteps} />
</article>
<aside aria-label="Contexto do recurso" className="detail-context">
  <TagList tags={item.tags} />
  <PublicSources officialUrl={item.officialUrl} sourceUrls={item.sourceUrls} />
</aside>
```

Aplicar títulos “O que é”, “Quando faz sentido”, “Primeiro passo” e “Como a equipe pode usar” com o mesmo kicker. Usar alinhamento à esquerda, largura de leitura de 62 caracteres e `word-spacing: normal`.

- [ ] **Step 4: Rodar testes do detalhe.**

Run: `npm test -- --run src/features/catalog/FirstSteps.test.tsx src/features/catalog/CatalogDetailPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/catalog/FirstSteps.tsx src/features/catalog/FirstSteps.test.tsx src/features/catalog/CatalogDetailPanel.tsx src/features/catalog/CatalogDetailPanel.test.tsx src/styles.css
git commit -m "feat: structure catalog detail reading flow"
```

### Task 5: Assistente sob demanda

**Files:**
- Create: `src/features/catalog/AssistantSearch.tsx`
- Create: `src/features/catalog/AssistantSearch.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `AssistantSearch({ query, onQueryChange, results, renderResults })`.
- Só renderiza resultados com `query.trim().length >= 2`.

- [ ] **Step 1: Escrever testes para o estado inicial e busca incremental.**

```tsx
it('does not show catalog cards before a search starts', () => {
  render(<AssistantSearch query="" onQueryChange={() => {}} results={[item]} renderResults={() => <article>Card</article>} />)
  expect(screen.queryByText('Card')).not.toBeInTheDocument()
})

it('shows matching cards after two useful characters', () => {
  render(<AssistantSearch query="ui" onQueryChange={() => {}} results={[item]} renderResults={() => <article>UI UX Pro Max</article>} />)
  expect(screen.getByText('UI UX Pro Max')).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste e confirmar falha pelo componente ausente.**

Run: `npm test -- --run src/features/catalog/AssistantSearch.test.tsx`

Expected: FAIL com módulo não encontrado.

- [ ] **Step 3: Implementar busca compacta sem acervo inicial.**

```tsx
const hasSearch = query.trim().length >= 2
return <section className="assistant-search">
  {hasSearch ? renderResults(results) : <p>Digite pelo menos 2 caracteres para explorar o acervo.</p>}
  {hasSearch && results.length === 0 ? <p role="status">Nenhum recurso corresponde à busca.</p> : null}
</section>
```

Usar exemplos clicáveis e busca imediata por título, resumo, tema e tag; não renderizar todos os cards nessa aba.

- [ ] **Step 4: Rodar testes de busca e App.**

Run: `npm test -- --run src/features/catalog/AssistantSearch.test.tsx src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/catalog/AssistantSearch.tsx src/features/catalog/AssistantSearch.test.tsx src/app/App.tsx src/styles.css
git commit -m "feat: make assistant search results on demand"
```

### Task 6: Suporte rico seguro e PWA dispensável

**Files:**
- Create: `src/features/support/RichTextComposer.tsx`
- Create: `src/features/support/SupportIllustration.tsx`
- Create: `src/features/support/rich-text.ts`
- Create: `src/features/support/rich-text.test.ts`
- Modify: `src/features/support/TicketForm.tsx`
- Modify: `src/app/App.tsx`
- Create: `supabase/migrations/20260812_support_rich_body.sql`
- Modify: `src/features/pwa/PwaInstallPrompt.tsx`
- Create: `src/features/pwa/PwaInstallPrompt.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `sanitizeSupportMarkup(input: string): string` e `RichTextComposer({ value, onChange })`.
- Produces: PWA com estados `closed | guidance | native-prompt | installed`.

- [ ] **Step 1: Escrever testes de limpeza e orientação dispensável.**

```ts
it('keeps only supported rich support markup', () => {
  expect(sanitizeSupportMarkup('<strong>Urgente</strong><script>x</script>')).toBe('<strong>Urgente</strong>')
})
```

```tsx
await user.click(screen.getByRole('button', { name: 'Instalar app' }))
expect(screen.getByText(/Android/i)).toBeInTheDocument()
expect(screen.getByText(/iPhone e iPad/i)).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: 'Fechar instruções' }))
expect(screen.queryByText(/Android/i)).not.toBeInTheDocument()
```

- [ ] **Step 2: Rodar os testes e confirmar falha pelas funções e botão ausentes.**

Run: `npm test -- --run src/features/support/rich-text.test.ts src/features/pwa/PwaInstallPrompt.test.tsx`

Expected: FAIL com exportação e botão ausentes.

- [ ] **Step 3: Implementar editor com lista permitida e orientação Android/iOS.**

```sql
alter table public.support_messages add column body_rich text not null default '';
alter table public.support_messages add constraint support_messages_body_rich_safe_length check (char_length(body_rich) <= 12000);
```

```tsx
if (deferredPrompt) await deferredPrompt.prompt()
else setGuidanceOpen(true)
```

O editor oferece negrito, itálico, sublinhado e seis cores fixas. `SupportIllustration` usa SVG local com `aria-hidden="true"`; não há upload de arquivo. A limpeza mantém somente `strong`, `em`, `u`, `span[data-color]` e texto; `App.tsx` envia corpo simples e rico. A orientação mostra Chrome no Android e Compartilhar → Adicionar à Tela de Início no Safari, sempre com botão Fechar.

- [ ] **Step 4: Rodar testes do suporte, PWA e App.**

Run: `npm test -- --run src/features/support/rich-text.test.ts src/features/support/TicketForm.test.tsx src/features/pwa/PwaInstallPrompt.test.tsx src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commitar a fatia.**

```bash
git add src/features/support src/features/pwa src/app/App.tsx src/styles.css supabase/migrations/20260812_support_rich_body.sql
git commit -m "feat: improve support composer and PWA guidance"
```

### Task 7: Revisão, validação e publicação da experiência

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.mobile-layout.test.ts`

**Interfaces:**
- Produces: títulos entre 32–58px em desktop e 30–44px em mobile; cards usam texto de 14–15px, linha 1.45–1.6 e não usam justificação.

- [ ] **Step 1: Escrever expectativa CSS de título compacto e grid móvel.**

```ts
expect(stylesheet).toMatch(/\.command-hero h1[^}]*font-size:\s*clamp\(32px,/)
expect(stylesheet).toMatch(/\.app-shell:not\(\.auth-shell\)[^}]*align-content:\s*start/)
```

- [ ] **Step 2: Rodar o teste e confirmar falha antes da redução.**

Run: `npm test -- --run src/styles.mobile-layout.test.ts`

Expected: FAIL para o limite de título anterior.

- [ ] **Step 3: Aplicar limites de tipografia e leitura.**

```css
.command-hero h1, .inner-page h1 { font-size: clamp(32px, 4vw, 58px); }
.catalog-card > p { font-size: 14px; line-height: 1.55; text-align: left; }
```

- [ ] **Step 4: Executar a verificação completa.**

Run: `npm test && npm run typecheck && npm run build && git diff --check`

Expected: testes, TypeScript, build e diff passam.

- [ ] **Step 5: Validar no navegador e publicar.**

Em 1920px, confirmar 20 cards na primeira página. Em 449px, abrir Favoritos e confirmar menu de no máximo 70px. Em Assistente, confirmar ausência de cards sem busca. Publicar usando as variáveis públicas do Supabase já configuradas no ambiente, sem imprimir ou versionar segredos.

```powershell
npm run build
npx wrangler pages deploy dist --project-name setup-vencedor --branch main --commit-dirty true
```

Expected: deploy concluído e login real preservado.
