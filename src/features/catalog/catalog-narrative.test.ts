import { expect, it } from 'vitest'
import { createCardSummary, createCatalogNarrative } from './catalog-narrative'
import type { CatalogItem } from './types'

const item: CatalogItem = {
  id: '1',
  slug: 'animation-skills',
  title: 'Skills de animacao para Claude Code',
  type: 'Skill',
  category: 'Skills',
  summary: 'Resumo',
  ownContent: 'Conteudo original',
  instructions: 'Instrucao original',
  officialUrl: 'https://example.com',
  sourceUrls: ['https://example.com'],
  tags: ['claude-code'],
  topics: ['IA e desenvolvimento'],
  status: 'published',
  visibility: 'team',
}

it('translates a skill into a practical starting point for the team', () => {
  const narrative = createCatalogNarrative(item)

  expect(narrative.whatItIs).toMatch(/habilidade/i)
  expect(narrative.whenToUse).toMatch(/desenvolvimento/i)
  expect(narrative.firstSteps).toHaveLength(3)
  expect(narrative.impact).toMatch(/ajuda/i)
})

it('creates concise Portuguese card copy without the repeated public-reference phrase', () => {
  const summary = createCardSummary({ ...item, type: 'Ferramenta', title: 'Open Higgsfield AI', summary: 'Referência pública para a equipe avaliar a fonte original.' })

  expect(summary).toMatch(/execução|decisão/i)
  expect(summary).not.toMatch(/Referência pública/i)
  expect(summary.split('. ').length).toBeLessThanOrEqual(2)
})

it('returns each first action as an individual ordered step', () => {
  expect(createCatalogNarrative(item).firstSteps).toEqual([
    expect.stringMatching(/fonte oficial/i),
    expect.stringMatching(/valid/i),
    expect.stringMatching(/registr/i),
  ])
})

it('uses the authored plain-language explanation on a guided catalog card', () => {
  const summary = createCardSummary({ ...item, guide: {
    catalogItemId: item.id, plainLanguage: 'É como um diretor de arte que ajuda o Claude a criar telas com identidade própria.', solves: 'Evita páginas genéricas.', whenToUse: 'Ao criar uma interface.', whenNotToUse: 'Ao corrigir banco.', firstSteps: ['Defina o público.', 'Teste uma tela.'], level: 'iniciante', prerequisites: [], estimatedMinutes: 20, sourceCheckedAt: '2026-08-13T12:00:00.000Z', sourceNote: 'Fonte oficial verificada.',
  } })

  expect(summary).toBe('É como um diretor de arte que ajuda o Claude a criar telas com identidade própria.')
})
