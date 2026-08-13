import { expect, it } from 'vitest'
import { getCatalogPageSize } from './useCatalogPageSize'

it.each([[1600, 20], [1260, 16], [960, 12], [640, 8], [390, 6]])(
  'uses %i px to select a complete page of %i cards',
  (width, expected) => expect(getCatalogPageSize(width)).toBe(expected),
)
