import { expect, it } from 'vitest'
import { guideFromRow } from './catalog-guide'

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
