# Neo Command Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um layout full width de alto impacto para descoberta e detalhamento do catálogo.

**Architecture:** `App.tsx` continuará sendo o orquestrador de sessão e dados. Componentes de apresentação isolam o painel de detalhe e os filtros por categoria; o CSS concentra o sistema visual responsivo e não altera a camada Supabase.

**Tech Stack:** React, TypeScript, Vite, Vitest, CSS nativo, Supabase.

## Global Constraints

- Preservar autenticação, permissões, fontes públicas e favoritos.
- Não copiar textos editoriais da plataforma de origem.
- Exibir dados reais do catálogo em vez de métricas inventadas.
- Manter navegação acessível e responsiva.

---

### Task 1: Detail panel and category discovery

**Files:**
- Create: `src/features/catalog/CatalogDetailPanel.tsx`
- Create: `src/features/catalog/CatalogDetailPanel.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `CatalogItem`, `FavoriteButton`, `PublicSources`.
- Produces: `CatalogDetailPanel({ item, isFavorite, onToggle, onClose })`.

- [ ] **Step 1: Write the failing tests** for item detail visibility, close action and category filtering.
- [ ] **Step 2: Run the focused tests** and confirm they fail because the detail panel and category controls do not exist.
- [ ] **Step 3: Implement the smallest accessible detail panel and category state** in the existing app.
- [ ] **Step 4: Run the focused tests** and confirm they pass.
- [ ] **Step 5: Commit the feature slice.**

### Task 2: Neo Command Deck presentation system

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/features/auth/LoginForm.tsx`

**Interfaces:**
- Consumes: existing pages and class names.
- Produces: full-width responsive shell, command header, side navigation, category rail and refined login layout.

- [ ] **Step 1: Add a visual regression test expectation** for the compact command-center copy and controls.
- [ ] **Step 2: Run the test** and confirm it fails against the previous shell.
- [ ] **Step 3: Implement the CSS system and updated component structure** without changing data behavior.
- [ ] **Step 4: Run all tests, typecheck and build.**
- [ ] **Step 5: Commit and publish after browser validation.**
