import { expect, it } from 'vitest'
import { createCatalogNarrative } from './catalog-narrative'
import type { CatalogItem } from './types'

const item: CatalogItem = {
  id: '1', slug: 'animation-skills', title: 'Skills de animacao para Claude Code', type: 'Skill', category: 'Skills', summary: 'Resumo', ownContent: 'Conteudo original', instructions: 'Instrucao original', officialUrl: 'https://example.com', sourceUrls: ['https://example.com'], tags: ['claude-code'], topics: ['IA e desenvolvimento'], status: 'published', visibility: 'team',
}

it('translates a skill into a practical starting point for the team', () => {
  const narrative = createCatalogNarrative(item)

  expect(narrative.whatItIs).toMatch(/instru[cç][aã]o reutiliz[aá]vel/i)
  expect(narrative.whenToUse).toMatch(/Skills de animacao para Claude Code/)
  expect(narrative.firstStep).toMatch(/fonte oficial/i)
})
