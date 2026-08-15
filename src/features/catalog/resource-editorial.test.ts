import { expect, it } from 'vitest'
import type { CatalogGuide } from './catalog-guide'
import { createResourceEditorial } from './resource-editorial'
import type { CatalogItem } from './types'

const item: CatalogItem = {
  id: 'context7', slug: 'context7', title: 'Context7', type: 'MCP',
  summary: 'Documentação atualizada.', ownContent: 'Reduz exemplos obsoletos.',
  officialUrl: 'https://github.com/upstash/context7', sourceUrls: [], instructions: 'npx context7',
  status: 'published', visibility: 'team', category: 'MCPs', topics: ['documentação'], tags: ['docs'],
}

const guide: CatalogGuide = {
  catalogItemId: 'context7', plainLanguage: 'Leva documentação atualizada para o fluxo.',
  solves: 'Reduz decisões baseadas em exemplos antigos.', whenToUse: 'Quando a tarefa depende de uma biblioteca atualizada.',
  whenNotToUse: 'Quando nenhuma fonte externa é necessária.', firstSteps: ['Abra a fonte oficial.', 'Teste em uma consulta pequena.', 'Registre o resultado.'],
  level: 'intermediario', prerequisites: [], estimatedMinutes: 15, sourceCheckedAt: null, sourceNote: 'Fonte pública cadastrada.',
}

it('gives every MCP an authored editorial route and category illustration family', () => {
  const editorial = createResourceEditorial(item, guide)

  expect(editorial.heading).toBe('Conecte contexto ao trabalho')
  expect(editorial.illustration.src).toBe('/illustrations/handdrawn/categories/mcps-connections.png')
  expect(editorial.steps).toHaveLength(4)
  expect(editorial.steps[0]).toMatchObject({ title: 'Entenda o recurso', detail: guide.plainLanguage })
  expect(editorial.steps[2].claudePrompt).toContain('https://github.com/upstash/context7')
  expect(editorial.steps[2].codexPrompt).toContain('Context7')
})

it('keeps the custom Frontend Design editorial story inside the shared renderer', () => {
  const editorial = createResourceEditorial({ ...item, slug: 'skills-frontend-design', title: 'Frontend Design', category: 'Skills' }, guide)

  expect(editorial.heading).toBe('Da ideia à primeira tela')
  expect(editorial.steps.map((step) => step.title)).toContain('Dê um clima à interface')
  expect(editorial.illustration.src).toBe('/illustrations/frontend-design-handdrawn-guide.png')
})
