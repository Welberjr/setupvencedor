import { expect, it } from 'vitest'
import { createFallbackCatalogGuide, guideFromRow } from './catalog-guide'
import type { CatalogItem } from './types'

it('maps a persisted guide into readable profile data', () => {
  expect(guideFromRow({
    catalog_item_id: 'item-1',
    plain_language: 'Explica telas de um jeito simples.',
    solves: 'Evita uma interface genérica.',
    when_to_use: 'Ao desenhar uma landing page.',
    when_not_to_use: 'Quando o problema é somente banco de dados.',
    first_steps: ['Defina o público.', 'Liste a ação principal.'],
    level: 'iniciante',
    prerequisites: ['Ter uma ideia de página'],
    estimated_minutes: 20,
    source_checked_at: '2026-08-13T12:00:00.000Z',
    source_note: 'Página oficial do mantenedor.',
  })).toMatchObject({
    catalogItemId: 'item-1',
    level: 'iniciante',
    estimatedMinutes: 20,
    firstSteps: ['Defina o público.', 'Liste a ação principal.'],
  })
})

it('builds a source-honest editorial guide when a published item has no persisted guide', () => {
  const item: CatalogItem = {
    id: 'context7',
    slug: 'context7',
    title: 'Context7',
    type: 'MCP',
    summary: 'Leva documentação atualizada para o fluxo de desenvolvimento.',
    ownContent: 'Use para reduzir exemplos obsoletos durante a implementação.',
    officialUrl: 'https://github.com/upstash/context7',
    sourceUrls: ['https://github.com/upstash/context7'],
    instructions: 'npx @upstash/context7-mcp',
    status: 'published',
    visibility: 'team',
    category: 'MCPs',
    topics: ['documentação'],
    tags: ['docs'],
  }

  const guide = createFallbackCatalogGuide(item)

  expect(guide.catalogItemId).toBe('context7')
  expect(guide.plainLanguage).toMatch(/Context7.*documentação atualizada/i)
  expect(guide.firstSteps).toEqual([
    'Abra a fonte oficial de Context7 e identifique o fluxo principal.',
    'Valide o recurso em uma tarefa pequena ligada a documentação.',
    'Registre o que funcionou antes de transformar o uso em padrão.',
  ])
  expect(guide.sourceCheckedAt).toBeNull()
  expect(guide.sourceNote).toMatch(/fonte pública cadastrada/i)
})
