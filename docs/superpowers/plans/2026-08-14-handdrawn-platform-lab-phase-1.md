# Handdrawn Platform Lab — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish an isolated, authenticated hand-drawn laboratory containing the real global shell, navigation and Explore experience while leaving the official deployment unchanged.

**Architecture:** Create a dedicated worktree and `codex/handdrawn-platform-lab` branch, snapshot only the current frontend source and public assets into it, and activate the new visual system through `VITE_VISUAL_MODE=handdrawn-lab`. The laboratory reuses the existing Supabase session, RLS and catalog data; reusable tokens, shell components and deterministic illustration mappings keep the visual layer independent from business logic.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 4, Testing Library, CSS, Cloudflare Pages, Supabase public client.

**Spec:** `docs/superpowers/specs/2026-08-14-handdrawn-platform-lab-design.md`

## Global Constraints

- The official domain and production deployment must remain unchanged throughout Phase 1.
- Develop in `C:\Dev\_worktrees\setup-vencedor-handdrawn-lab` on branch `codex/handdrawn-platform-lab`.
- Publish only to Cloudflare Pages branch `handdrawn-lab`, expected alias `https://handdrawn-lab.setup-vencedor.pages.dev`.
- The lab uses real data and must display `LABORATÓRIO VISUAL · DADOS REAIS` permanently for authenticated users.
- Preserve invite-only access, strict RLS, cumulative roles, deterministic catalog behavior, favorites and existing support behavior.
- No public registration, runtime generative AI, video, privileged browser key, schema migration or business-rule change.
- Never read, copy, stage or version `Chaves.txt`, `.env*`, Cloudflare credentials, Supabase service-role keys or Resend secrets.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may enter the frontend build.
- Text, links, fields and buttons remain semantic HTML; illustrations never contain required operational copy.
- Use TDD for every behavior or structure change: failing test, expected failure, minimal implementation, passing test, then commit.
- Preserve unrelated changes in `C:\Dev\Setup-Vencedor`.

## Phase 1 File Map

### Create

- `src/features/handdrawn/visual-mode.ts` — parses and exposes the build visual mode.
- `src/features/handdrawn/visual-mode.test.ts` — proves safe default and explicit lab activation.
- `src/features/handdrawn/HanddrawnLabBadge.tsx` — persistent real-data warning and official-site comparison link.
- `src/features/handdrawn/HanddrawnLabBadge.test.tsx` — accessible label and destination tests.
- `src/features/handdrawn/illustration-registry.ts` — deterministic area/category illustration lookup.
- `src/features/handdrawn/illustration-registry.test.ts` — mapping and fallback tests.
- `src/features/handdrawn/IllustratedHero.tsx` — semantic title, explanation and optional artwork.
- `src/features/handdrawn/IllustratedHero.test.tsx` — heading, copy and image alternative tests.
- `src/features/handdrawn/ExploreHero.tsx` — the Explore-specific illustrated introduction and count note.
- `src/features/handdrawn/ExploreHero.test.tsx` — real count and accessible hero tests.
- `src/styles/handdrawn-tokens.css` — paper, ink, brand colors, spacing, shadow and radius tokens.
- `src/styles/handdrawn-shell.css` — global paper canvas, rail, topbar, badge and shared controls.
- `src/styles/handdrawn-explore.css` — Explore hero, search, category menu, cards and pagination.
- `src/styles/handdrawn-responsive.css` — tablet, mobile, reduced-motion and touch behavior.
- `src/styles/handdrawn-styles.test.ts` — static guarantees for scoping, mobile layout and reduced motion.
- `public/illustrations/handdrawn/explore-library.png` — original light-paper library/laptop illustration with no text.

### Modify

- `src/app/App.tsx` — accepts visual mode, scopes the root, mounts the lab badge and uses the illustrated Explore hero.
- `src/app/App.test.tsx` — proves official/lab isolation and existing Explore interactions.
- `src/app/App.layout.test.tsx` — proves lab heading semantics without altering official assertions.
- `src/main.tsx` — resolves the build visual mode and imports lab styles.
- `src/vite-env.d.ts` — types `VITE_VISUAL_MODE`.
- `src/styles.css` — only shared corrections that cannot live under `.handdrawn-lab`; Phase 1 should normally avoid editing it.
- `.gitignore` — ignores `.superpowers/` brainstorming artifacts if not already ignored.

### Generated but not committed

- `dist/` — lab build output.
- `.superpowers/` — visual brainstorming companion state.
- `.env*` — never created for this plan.

---

### Task 1: Create the isolated laboratory snapshot

**Files:**
- Create worktree: `C:\Dev\_worktrees\setup-vencedor-handdrawn-lab`
- Snapshot from: `C:\Dev\Setup-Vencedor\src\**`, `C:\Dev\Setup-Vencedor\public\**`
- Modify: `.gitignore`
- Do not copy: `.env*`, `Chaves.txt`, `.superpowers/`, `dist/`, `node_modules/`

**Interfaces:**
- Consumes: current approved frontend behavior and the approved planning `HEAD` containing the laboratory specification and this execution plan.
- Produces: branch `codex/handdrawn-platform-lab` with an exact frontend-only baseline and installed dependencies.

- [ ] **Step 1: Create the worktree using the required worktree skill**

Invoke `superpowers:using-git-worktrees`, then create the approved location and branch:

```powershell
git worktree add 'C:\Dev\_worktrees\setup-vencedor-handdrawn-lab' -b 'codex/handdrawn-platform-lab' HEAD
```

Expected: a clean worktree on `codex/handdrawn-platform-lab`; the original checkout remains dirty and unchanged.

- [ ] **Step 2: Snapshot only current frontend source and public assets**

Run from PowerShell without deleting from either location:

```powershell
$labRoot = 'C:\Dev\_worktrees\setup-vencedor-handdrawn-lab'
New-Item -ItemType Directory -Force -Path "$labRoot\src", "$labRoot\public" | Out-Null
Copy-Item -LiteralPath 'C:\Dev\Setup-Vencedor\src' -Destination "$labRoot\_frontend_snapshot" -Recurse -Force
Copy-Item -LiteralPath 'C:\Dev\Setup-Vencedor\public' -Destination "$labRoot\_public_snapshot" -Recurse -Force
Copy-Item -Path "$labRoot\_frontend_snapshot\*" -Destination "$labRoot\src" -Recurse -Force
Copy-Item -Path "$labRoot\_public_snapshot\*" -Destination "$labRoot\public" -Recurse -Force
```

Then remove only the two verified temporary directories inside the new worktree after checking their resolved paths equal the intended targets:

```powershell
$labRoot = (Resolve-Path 'C:\Dev\_worktrees\setup-vencedor-handdrawn-lab').Path
$tempSources = @((Resolve-Path "$labRoot\_frontend_snapshot").Path, (Resolve-Path "$labRoot\_public_snapshot").Path)
if ($tempSources | Where-Object { -not $_.StartsWith($labRoot + '\') }) { throw 'Temporary snapshot escaped the lab worktree.' }
Remove-Item -LiteralPath $tempSources -Recurse -Force
```

Expected: only `src/` and `public/` reproduce the current frontend. No root-level private file is copied.

- [ ] **Step 3: Ignore brainstorming state**

Append through `apply_patch` only when `.gitignore` lacks the entry:

```gitignore
.superpowers/
```

- [ ] **Step 4: Install dependencies and run the baseline**

```powershell
npm ci
npm test -- src/app/App.test.tsx src/features/catalog/ResourceProfilePage.test.tsx
npm run typecheck
```

Expected: relevant current frontend tests and typecheck pass before redesign work. If an inherited test fails, record it and repair the snapshot before proceeding.

- [ ] **Step 5: Verify the snapshot contains no secret artifacts**

```powershell
git status --short
git status --short | Select-String -Pattern 'Chaves\.txt|\.env|node_modules|dist|\.superpowers' -CaseSensitive:$false
```

Expected: the second command prints nothing. Do not open any matched secret file; stop and remove it from the lab worktree if a path appears.

- [ ] **Step 6: Commit the isolated baseline**

```powershell
git add -- src public .gitignore
git diff --cached --name-only
git commit -m "chore: snapshot frontend for handdrawn lab"
```

Expected: staged paths are limited to `src`, `public` and `.gitignore`.

---

### Task 2: Add a safe build-time visual mode

**Files:**
- Create: `src/features/handdrawn/visual-mode.ts`
- Test: `src/features/handdrawn/visual-mode.test.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: optional `VITE_VISUAL_MODE` string from Vite.
- Produces: `type VisualMode = 'command-center' | 'handdrawn-lab'` and `readVisualMode(value?: string): VisualMode`.

- [ ] **Step 1: Write the failing mode parser test**

```ts
import { expect, it } from 'vitest'
import { readVisualMode } from './visual-mode'

it('keeps the official command center as the safe default', () => {
  expect(readVisualMode()).toBe('command-center')
  expect(readVisualMode('unexpected')).toBe('command-center')
})

it('activates the handdrawn laboratory only for its explicit build value', () => {
  expect(readVisualMode('handdrawn-lab')).toBe('handdrawn-lab')
})
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm test -- src/features/handdrawn/visual-mode.test.ts
```

Expected: FAIL because `visual-mode.ts` does not exist.

- [ ] **Step 3: Implement the minimal parser**

```ts
export type VisualMode = 'command-center' | 'handdrawn-lab'

export function readVisualMode(value?: string): VisualMode {
  return value === 'handdrawn-lab' ? 'handdrawn-lab' : 'command-center'
}
```

Add to `src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_VISUAL_MODE?: 'command-center' | 'handdrawn-lab'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: Run test and typecheck**

```powershell
npm test -- src/features/handdrawn/visual-mode.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/handdrawn/visual-mode.ts src/features/handdrawn/visual-mode.test.ts src/vite-env.d.ts
git commit -m "feat: isolate handdrawn visual mode"
```

---

### Task 3: Scope the application shell and real-data warning

**Files:**
- Create: `src/features/handdrawn/HanddrawnLabBadge.tsx`
- Test: `src/features/handdrawn/HanddrawnLabBadge.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `VisualMode`, official URL `https://www.setupvencedor.com.br/`.
- Produces: `HanddrawnLabBadge`, root classes `app-shell command-center` or `app-shell handdrawn-lab`, and the build-mode integration at the application entrypoint.

- [ ] **Step 1: Write failing shell-isolation tests**

Add to `src/app/App.test.tsx`:

```tsx
it('keeps the official shell unchanged by default', () => {
  const { container } = render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(container.querySelector('.app-shell')).toHaveClass('command-center')
  expect(screen.queryByText('LABORATÓRIO VISUAL · DADOS REAIS')).not.toBeInTheDocument()
})

it('scopes the handdrawn lab and warns that actions use real data', () => {
  const { container } = render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(container.querySelector('.app-shell')).toHaveClass('handdrawn-lab')
  expect(screen.getByText('LABORATÓRIO VISUAL · DADOS REAIS')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('href', 'https://www.setupvencedor.com.br/')
})
```

Create `HanddrawnLabBadge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HanddrawnLabBadge } from './HanddrawnLabBadge'

it('opens the official platform in a separate browsing context', () => {
  render(<HanddrawnLabBadge />)
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('rel', 'noreferrer')
})
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- src/app/App.test.tsx src/features/handdrawn/HanddrawnLabBadge.test.tsx
```

Expected: FAIL because `App` has no `visualMode` prop and the badge does not exist.

- [ ] **Step 3: Implement badge and root scoping**

```tsx
export function HanddrawnLabBadge() {
  return <aside className="handdrawn-lab-badge" aria-label="Ambiente do laboratório">
    <strong>LABORATÓRIO VISUAL · DADOS REAIS</strong>
    <a href="https://www.setupvencedor.com.br/" rel="noreferrer" target="_blank">Comparar com a plataforma oficial</a>
  </aside>
}
```

Extend `App`:

```ts
import type { VisualMode } from '../features/handdrawn/visual-mode'
import { HanddrawnLabBadge } from '../features/handdrawn/HanddrawnLabBadge'

export function App({ session = null, visualMode = 'command-center' }: { session?: Session; visualMode?: VisualMode }) {
```

For authenticated and auth shells, include the correct root class. Inside the authenticated topbar, render:

```tsx
{visualMode === 'handdrawn-lab' ? <HanddrawnLabBadge /> : null}
```

In `src/main.tsx`, resolve the build mode once and pass it to `App`:

```ts
import { readVisualMode } from './features/handdrawn/visual-mode'

const visualMode = readVisualMode(import.meta.env.VITE_VISUAL_MODE)
```

```tsx
return <App session={session} visualMode={visualMode} />
```

- [ ] **Step 4: Run tests and typecheck**

```powershell
npm test -- src/app/App.test.tsx src/features/handdrawn/HanddrawnLabBadge.test.tsx
npm run typecheck
```

Expected: PASS; existing navigation, category and pagination tests remain green.

- [ ] **Step 5: Commit**

```powershell
git add src/app/App.tsx src/app/App.test.tsx src/main.tsx src/features/handdrawn/HanddrawnLabBadge.tsx src/features/handdrawn/HanddrawnLabBadge.test.tsx
git commit -m "feat: add handdrawn laboratory shell"
```

---

### Task 4: Establish the paper design tokens and responsive shell

**Files:**
- Create: `src/styles/handdrawn-tokens.css`
- Create: `src/styles/handdrawn-shell.css`
- Create: `src/styles/handdrawn-responsive.css`
- Create: `src/styles/handdrawn-styles.test.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `.handdrawn-lab` root class.
- Produces: scoped CSS custom properties and responsive shell primitives used by all later lab components.

- [ ] **Step 1: Write the failing static style contract**

```ts
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const tokens = readFileSync('src/styles/handdrawn-tokens.css', 'utf8')
const shell = readFileSync('src/styles/handdrawn-shell.css', 'utf8')
const responsive = readFileSync('src/styles/handdrawn-responsive.css', 'utf8')

it('scopes paper and ink tokens to the laboratory', () => {
  expect(tokens).toContain('.handdrawn-lab {')
  expect(tokens).toContain('--paper: #f8f0dc')
  expect(tokens).toContain('--ink: #201f1b')
  expect(tokens).toContain('--brand-green: #caff3d')
})

it('keeps responsive and reduced-motion behavior inside the laboratory', () => {
  expect(responsive).toContain('@media (max-width: 820px)')
  expect(responsive).toContain('@media (prefers-reduced-motion: reduce)')
  expect(shell).toContain('.handdrawn-lab .command-rail')
})
```

- [ ] **Step 2: Run test and verify RED**

```powershell
npm test -- src/styles/handdrawn-styles.test.ts
```

Expected: FAIL because the CSS files do not exist.

- [ ] **Step 3: Add exact token foundation**

Create `handdrawn-tokens.css` with this root contract:

```css
.handdrawn-lab {
  --paper: #f8f0dc;
  --paper-raised: #fffaf0;
  --ink: #201f1b;
  --ink-muted: #575149;
  --brand-green: #caff3d;
  --note-blue: #c9e6ff;
  --note-coral: #ffd1ca;
  --note-lilac: #e9dcff;
  --note-green: #ddf4d2;
  --pencil-blue: #2874a5;
  --paper-border: 2px solid var(--ink);
  --sketch-shadow: 4px 5px 0 #201f1b3d;
  color: var(--ink);
  background: var(--paper);
}
```

Create `handdrawn-shell.css` with the following minimum contract:

```css
.handdrawn-lab .command-rail { border-right: var(--paper-border); background: var(--paper-raised); color: var(--ink); }
.handdrawn-lab .workspace { min-width: 0; background: radial-gradient(#c8b99155 .8px, transparent .8px) 0 0 / 9px 9px, var(--paper); }
.handdrawn-lab .topbar { border-bottom: 2px dashed #b78056; background: #fffaf0cc; color: var(--ink); }
.handdrawn-lab .main-nav button { min-height: 48px; border: 2px solid transparent; border-radius: 11px 16px 12px 14px; color: var(--ink-muted); }
.handdrawn-lab .main-nav button.active { border-color: var(--ink); background: var(--brand-green); box-shadow: var(--sketch-shadow); color: var(--ink); }
.handdrawn-lab .identity { border: var(--paper-border); background: var(--paper-raised); box-shadow: 2px 3px 0 #201f1b35; color: var(--ink); }
.handdrawn-lab .handdrawn-lab-badge { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 2px dashed #9d5e2e; border-radius: 12px; background: var(--note-coral); color: var(--ink); }
.handdrawn-lab .handdrawn-lab-badge a { color: #174f74; font-weight: 800; }
.handdrawn-lab :is(button, a, input, select, textarea):focus-visible { outline: 3px solid #174f74; outline-offset: 3px; }
```

Create `handdrawn-responsive.css` with these exact baseline rules:

```css
@media (max-width: 820px) {
  .handdrawn-lab:not(.auth-shell) { grid-template-columns: 1fr; align-content: start; }
  .handdrawn-lab .command-rail { position: sticky; top: 0; z-index: 30; width: 100%; border-right: 0; border-bottom: var(--paper-border); }
  .handdrawn-lab .main-nav button, .handdrawn-lab button, .handdrawn-lab a { min-height: 44px; }
  .handdrawn-lab .topbar { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 540px) {
  .handdrawn-lab .workspace { overflow-x: clip; }
  .handdrawn-lab .handdrawn-lab-badge { align-items: flex-start; flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .handdrawn-lab *, .handdrawn-lab *::before, .handdrawn-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
```

- [ ] **Step 4: Import styles after the official stylesheet**

In `src/main.tsx`:

```ts
import './styles.css'
import './styles/handdrawn-tokens.css'
import './styles/handdrawn-shell.css'
import './styles/handdrawn-explore.css'
import './styles/handdrawn-responsive.css'
```

Create an initially empty `handdrawn-explore.css` with a comment so the import resolves:

```css
/* Phase 1 Explore rules are added after the shared shell is verified. */
```

- [ ] **Step 5: Run style test, relevant app test and typecheck**

```powershell
npm test -- src/styles/handdrawn-styles.test.ts src/app/App.test.tsx
npm run typecheck
```

Expected: PASS with no official-class assertion changed.

- [ ] **Step 6: Commit**

```powershell
git add src/main.tsx src/styles/handdrawn-tokens.css src/styles/handdrawn-shell.css src/styles/handdrawn-explore.css src/styles/handdrawn-responsive.css src/styles/handdrawn-styles.test.ts
git commit -m "feat: add handdrawn design foundation"
```

---

### Task 5: Add deterministic illustrations and the Explore artwork

**Files:**
- Create: `public/illustrations/handdrawn/explore-library.png`
- Create: `src/features/handdrawn/illustration-registry.ts`
- Test: `src/features/handdrawn/illustration-registry.test.ts`
- Create: `src/features/handdrawn/IllustratedHero.tsx`
- Test: `src/features/handdrawn/IllustratedHero.test.tsx`

**Interfaces:**
- Consumes: area key `'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'auth'`.
- Produces: `getAreaIllustration(area): HanddrawnIllustration`, where `HanddrawnIllustration = { src: string; alt: string }`.

- [ ] **Step 1: Write failing registry and hero tests**

```ts
import { expect, it } from 'vitest'
import { getAreaIllustration } from './illustration-registry'

it('maps Explore to its authored static illustration', () => {
  expect(getAreaIllustration('explore')).toEqual({
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados',
  })
})
```

```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { IllustratedHero } from './IllustratedHero'

it('keeps the heading and explanation as real text beside the artwork', () => {
  render(<IllustratedHero eyebrow="BEM-VINDO AO ACERVO" title="Escolha o próximo atalho técnico." description="Encontre o recurso certo." illustration={{ src: '/illustration.png', alt: 'Mapa desenhado' }} />)
  expect(screen.getByRole('heading', { name: 'Escolha o próximo atalho técnico.' })).toBeInTheDocument()
  expect(screen.getByText('Encontre o recurso certo.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Mapa desenhado' })).toHaveAttribute('src', '/illustration.png')
})
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- src/features/handdrawn/illustration-registry.test.ts src/features/handdrawn/IllustratedHero.test.tsx
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Generate the original Explore illustration**

Use the project image-generation capability with this exact art direction:

```text
Create a wide transparent-or-warm-paper illustration for the private developer library “Setup Vencedor”. Genuine hand-drawn study-note style in black ink and colored pencil. Show a small bookshelf of technical cards, an open laptop with a simple interface wireframe, a magnifying glass, a pencil, bookmarks, and curved arrows connecting discoveries. Palette: lime green, light blue, coral and lilac on warm ivory paper. No words, no letters, no logos, no UI buttons, no dark background, no photorealism. Leave generous breathing room and keep the composition readable at 420px wide.
```

Inspect the result, reject unreadable or text-bearing output, then save the approved asset at `public/illustrations/handdrawn/explore-library.png`.

- [ ] **Step 4: Implement registry and semantic hero**

```ts
export type HanddrawnArea = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'auth'
export type HanddrawnIllustration = { src: string; alt: string }

const areaIllustrations: Record<HanddrawnArea, HanddrawnIllustration> = {
  explore: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados' },
  assistant: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Caminhos desenhados entre recursos técnicos' },
  favorites: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Fichas técnicas organizadas em uma biblioteca desenhada' },
  support: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Ferramentas técnicas organizadas em uma mesa desenhada' },
  admin: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Biblioteca técnica desenhada e organizada' },
  auth: { src: '/illustrations/handdrawn/explore-library.png', alt: 'Entrada desenhada para uma biblioteca privada' },
}

export function getAreaIllustration(area: HanddrawnArea): HanddrawnIllustration {
  return areaIllustrations[area]
}
```

`IllustratedHero` accepts `eyebrow`, `title`, `description`, `illustration` and optional `aside`, renders one semantic heading and a sized `<img width="420" height="320" loading="eager">`.

- [ ] **Step 5: Run tests, typecheck and asset checks**

```powershell
npm test -- src/features/handdrawn/illustration-registry.test.ts src/features/handdrawn/IllustratedHero.test.tsx
npm run typecheck
Get-Item public/illustrations/handdrawn/explore-library.png | Select-Object Name, Length
```

Expected: tests and typecheck PASS; asset length is greater than 10 KB.

- [ ] **Step 6: Commit**

```powershell
git add public/illustrations/handdrawn/explore-library.png src/features/handdrawn/illustration-registry.ts src/features/handdrawn/illustration-registry.test.ts src/features/handdrawn/IllustratedHero.tsx src/features/handdrawn/IllustratedHero.test.tsx
git commit -m "feat: add authored Explore illustration"
```

---

### Task 6: Replace the lab Explore hero without changing official behavior

**Files:**
- Create: `src/features/handdrawn/ExploreHero.tsx`
- Test: `src/features/handdrawn/ExploreHero.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.layout.test.tsx`

**Interfaces:**
- Consumes: `totalItems: number`, `VisualMode`, `getAreaIllustration('explore')`.
- Produces: lab-only `ExploreHero`; official hero markup remains the current command-center version.

- [ ] **Step 1: Write the failing Explore hero test**

```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ExploreHero } from './ExploreHero'

it('shows the exact catalog total as a handdrawn note', () => {
  render(<ExploreHero totalItems={347} />)
  expect(screen.getByRole('heading', { name: 'Escolha o próximo atalho técnico.' })).toBeInTheDocument()
  expect(screen.getByText('347 recursos para descobrir.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Biblioteca desenhada/i })).toBeInTheDocument()
})
```

Add to `App.layout.test.tsx`:

```tsx
it('uses the illustrated Explore heading only inside the lab', () => {
  const { rerender } = render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.queryByText(/recursos para descobrir/i)).not.toBeInTheDocument()
  rerender(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByText(/recursos para descobrir/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- src/features/handdrawn/ExploreHero.test.tsx src/app/App.layout.test.tsx
```

Expected: FAIL because `ExploreHero` does not exist and the lab uses the official heading.

- [ ] **Step 3: Implement `ExploreHero`**

```tsx
import { getAreaIllustration } from './illustration-registry'
import { IllustratedHero } from './IllustratedHero'

export function ExploreHero({ totalItems }: { totalItems: number }) {
  return <IllustratedHero
    eyebrow="BEM-VINDO AO ACERVO"
    title="Escolha o próximo atalho técnico."
    description="Cada recurso vem com uma explicação humana, um caminho de uso e ações claras para começar sem travar."
    illustration={getAreaIllustration('explore')}
    aside={<aside className="handdrawn-count-note"><small>SEU CADERNO</small><strong>{totalItems} recursos para descobrir.</strong></aside>}
  />
}
```

In `App.tsx`, render `ExploreHero totalItems={catalog.length}` only when `visualMode === 'handdrawn-lab'`; otherwise preserve the exact existing `.command-hero` block.

- [ ] **Step 4: Run tests and typecheck**

```powershell
npm test -- src/features/handdrawn/ExploreHero.test.tsx src/app/App.layout.test.tsx src/app/App.test.tsx
npm run typecheck
```

Expected: PASS; exact catalog count is not hard-coded in production code.

- [ ] **Step 5: Commit**

```powershell
git add src/features/handdrawn/ExploreHero.tsx src/features/handdrawn/ExploreHero.test.tsx src/app/App.tsx src/app/App.layout.test.tsx
git commit -m "feat: add illustrated Explore hero"
```

---

### Task 7: Style real Explore interactions as a handdrawn library

**Files:**
- Modify: `src/styles/handdrawn-explore.css`
- Modify: `src/styles/handdrawn-responsive.css`
- Modify: `src/styles/handdrawn-styles.test.ts`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: existing `.explore-search`, `.explore-submenu`, `.catalog-grid`, `.catalog-card`, `.card-actions`, `.catalog-pagination` markup.
- Produces: lab-scoped paper search, colored cards, drawn actions, category notes and responsive catalog grid.

- [ ] **Step 1: Add a failing style contract**

Add to `handdrawn-styles.test.ts`:

```ts
const explore = readFileSync('src/styles/handdrawn-explore.css', 'utf8')

it('styles every Explore control only under the laboratory root', () => {
  expect(explore).toContain('.handdrawn-lab .explore-search')
  expect(explore).toContain('.handdrawn-lab .explore-submenu')
  expect(explore).toContain('.handdrawn-lab .catalog-card')
  expect(explore).toContain('.handdrawn-lab .catalog-pagination')
  expect(explore).not.toMatch(/(^|\n)\.catalog-card\s*\{/)
})
```

- [ ] **Step 2: Run test and verify RED**

```powershell
npm test -- src/styles/handdrawn-styles.test.ts
```

Expected: FAIL because the Explore stylesheet contains none of the required rules.

- [ ] **Step 3: Implement lab-scoped Explore styling**

Add rules with these exact responsibilities:

```css
.handdrawn-lab .explore-search { border: var(--paper-border); background: var(--paper-raised); box-shadow: var(--sketch-shadow); }
.handdrawn-lab .explore-submenu { border: var(--paper-border); background: var(--paper-raised); box-shadow: var(--sketch-shadow); }
.handdrawn-lab .catalog-card { border: var(--paper-border); background: var(--note-blue); box-shadow: var(--sketch-shadow); color: var(--ink); }
.handdrawn-lab .catalog-card:nth-child(3n + 2) { background: var(--note-lilac); transform: rotate(.35deg); }
.handdrawn-lab .catalog-card:nth-child(3n) { background: var(--note-green); transform: rotate(-.35deg); }
.handdrawn-lab .catalog-card .details-button { border: var(--paper-border); background: var(--paper-raised); color: var(--ink); }
.handdrawn-lab .catalog-pagination { color: var(--ink); }
```

Add the remaining interaction and responsive contract explicitly:

```css
.handdrawn-lab .catalog-card h2 { color: var(--ink); font-family: 'Comic Sans MS', 'Segoe Print', cursive; letter-spacing: -.045em; }
.handdrawn-lab .catalog-card > p { color: var(--ink-muted); }
.handdrawn-lab .catalog-card:is(:hover, :focus-within) { transform: translateY(-4px) rotate(-.25deg); box-shadow: 7px 9px 0 #201f1b45; }
.handdrawn-lab .explore-submenu button.selected { border: var(--paper-border); background: var(--brand-green); color: var(--ink); }
.handdrawn-lab .favorite { border: var(--paper-border); background: var(--note-coral); color: var(--ink); }
.handdrawn-lab .favorite.active { background: var(--brand-green); color: var(--ink); }
.handdrawn-lab .catalog-pagination button { min-width: 44px; min-height: 44px; border: var(--paper-border); background: var(--paper-raised); color: var(--ink); }
.handdrawn-lab .catalog-pagination button:disabled { opacity: .48; cursor: not-allowed; }

@media (max-width: 820px) {
  .handdrawn-lab .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 540px) {
  .handdrawn-lab .catalog-grid { grid-template-columns: 1fr; }
  .handdrawn-lab .catalog-card, .handdrawn-lab .catalog-card:nth-child(n) { transform: none; }
}
```

- [ ] **Step 4: Re-run real interaction tests**

```powershell
npm test -- src/styles/handdrawn-styles.test.ts src/app/App.test.tsx src/features/catalog/FavoriteButton.test.tsx src/features/catalog/useCatalogPageSize.test.ts
```

Expected: PASS for category selection, search presence, details, favorite and pagination behavior.

- [ ] **Step 5: Commit**

```powershell
git add src/styles/handdrawn-explore.css src/styles/handdrawn-responsive.css src/styles/handdrawn-styles.test.ts src/app/App.test.tsx
git commit -m "feat: draw the Explore library experience"
```

---

### Task 8: Verify accessibility, mobile behavior and official isolation

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/styles/handdrawn-styles.test.ts`
- Modify only if a failure requires it: `src/app/App.tsx`, `src/styles/handdrawn-*.css`

**Interfaces:**
- Consumes: complete Phase 1 lab shell and Explore experience.
- Produces: automated evidence that the lab remains accessible, responsive and isolated.

- [ ] **Step 1: Add regression assertions for the completed Phase 1 contract**

```tsx
it('keeps all primary Explore actions available in the handdrawn lab', async () => {
  const user = userEvent.setup()
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByLabelText('Buscar no acervo')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Paginação do acervo' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Explorar e filtrar categorias' }))
  expect(screen.getByLabelText('Filtrar acervo')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /Ver detalhes/i }).length).toBeGreaterThan(0)
})
```

Extend the style contract:

```ts
it('defines visible focus, touch targets and motion reduction', () => {
  expect(shell).toContain(':focus-visible')
  expect(responsive).toContain('min-height: 44px')
  expect(responsive).toContain('prefers-reduced-motion: reduce')
})
```

- [ ] **Step 2: Run the focused regression suite**

```powershell
npm test -- src/app/App.test.tsx src/app/App.layout.test.tsx src/styles/handdrawn-styles.test.ts
```

Expected: PASS because Tasks 3, 4, 6 and 7 already implemented these contracts. This task adds verification coverage and does not authorize a behavior change.

- [ ] **Step 3: Audit the implemented contract against the assertions**

Read the rendered selectors and confirm: focus uses a 3px solid high-contrast outline with 3px offset, interactive controls have at least 44px height on touch layouts, card rotations are removed under 540px and all transitions are disabled for reduced motion. If the audit reveals a defect, stop this task, add one failing regression assertion that reproduces that exact defect, then apply the smallest fix and rerun Step 2.

- [ ] **Step 4: Run Phase 1 automated verification**

```powershell
npm test -- src/features/handdrawn src/app/App.test.tsx src/app/App.layout.test.tsx src/styles/handdrawn-styles.test.ts src/features/catalog/FavoriteButton.test.tsx src/features/catalog/pagination.test.ts src/features/catalog/useCatalogPageSize.test.ts
npm run typecheck
npm run lint
```

Expected: all commands PASS without warnings introduced by Phase 1.

- [ ] **Step 5: Commit**

```powershell
git add src/app/App.tsx src/app/App.test.tsx src/styles/handdrawn-shell.css src/styles/handdrawn-explore.css src/styles/handdrawn-responsive.css src/styles/handdrawn-styles.test.ts
git commit -m "test: protect handdrawn Explore accessibility"
```

---

### Task 9: Build, publish and inspect the isolated Phase 1 laboratory

**Files:**
- Build output: `dist/` (not committed)
- Cloudflare preview branch: `handdrawn-lab`
- No production file, domain or branch changes.

**Interfaces:**
- Consumes: configured public Supabase URL/key and Phase 1 branch.
- Produces: authenticated preview at `https://handdrawn-lab.setup-vencedor.pages.dev` and a verification report.

- [ ] **Step 1: Confirm branch, worktree and clean task scope**

```powershell
git branch --show-current
git status --short
git log -8 --oneline
```

Expected: branch is `codex/handdrawn-platform-lab`; only intentional uncommitted verification artifacts may appear.

- [ ] **Step 2: Build the laboratory with configured public variables**

Use the already configured public credential source; never use `Chaves.txt` or print values:

```powershell
$env:VITE_VISUAL_MODE = 'handdrawn-lab'
npm run build
$env:VITE_VISUAL_MODE = $null
```

Expected: prebuild validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; TypeScript and Vite build succeed.

- [ ] **Step 3: Publish only the preview branch**

```powershell
npx wrangler pages deploy dist --project-name setup-vencedor --branch handdrawn-lab --commit-dirty=true
```

Expected: deployment alias is `https://handdrawn-lab.setup-vencedor.pages.dev`; no production deployment command is run.

- [ ] **Step 4: Verify HTTP routes and static illustration**

```powershell
$labUrl = 'https://handdrawn-lab.setup-vencedor.pages.dev'
(Invoke-WebRequest -UseBasicParsing "$labUrl/").StatusCode
(Invoke-WebRequest -UseBasicParsing "$labUrl/illustrations/handdrawn/explore-library.png").StatusCode
```

Expected: both return 200.

- [ ] **Step 5: Inspect the real authenticated desktop flow**

Open the preview in the available authenticated browser and verify:

```text
LABORATÓRIO VISUAL · DADOS REAIS is visible
Official comparison link opens setupvencedor.com.br in a new tab
Explore count equals the loaded catalog total
Search filters cards
Category menu opens and changes the exact result total
Favorite toggles and persists after reload
Resource details open
Pagination changes page when more than one page exists
No console error originates from the lab UI
```

- [ ] **Step 6: Inspect responsive layouts**

Verify at 1440×900, 820×1180 and 390×844. Capture one screenshot per viewport. Confirm no horizontal overflow, clipped illustration, overlapping rail, illegible handwriting or control mistaken for decoration.

- [ ] **Step 7: Record Phase 1 handoff**

Report the preview URL, deployment identifier, focused test counts, build result, inspected viewports, confirmed interactions and any explicitly pending account-role checks. State clearly that production was untouched.

- [ ] **Step 8: Push the laboratory branch only after verification**

```powershell
git push -u origin codex/handdrawn-platform-lab
```

Expected: branch push succeeds. Do not merge, open a production PR or deploy to the production branch.

---

## Phase 1 Completion Gate

Phase 1 is complete only when the parallel URL is authenticated and navigable, the exact catalog total is visible, Explore actions work, the light handdrawn system is visually checked at all three viewports, automated verification passes and Welber approves the Phase 1 preview.

After approval, write a separate Phase 2 implementation plan for `ResourceStorySheet`, resource illustration families, sources and Claude Code/Codex copy actions. Do not begin Phase 2 from this plan.
