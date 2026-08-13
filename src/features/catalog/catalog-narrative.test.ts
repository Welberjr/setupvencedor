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
