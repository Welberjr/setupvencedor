import { expect, it } from 'vitest'
import { dedupeCatalogItems } from './catalog-deduplication'

it('keeps the polished title when an imported catalog skill has a duplicate slug-style title', () => {
  const items = dedupeCatalogItems([
    { id: 'github-copy', title: 'frontend-design' },
    { id: 'official-copy', title: 'Frontend Design' },
    { id: 'other', title: 'Direção visual para interfaces feitas com agentes' },
  ])

  expect(items).toEqual([
    { id: 'official-copy', title: 'Frontend Design' },
    { id: 'other', title: 'Direção visual para interfaces feitas com agentes' },
  ])
})
