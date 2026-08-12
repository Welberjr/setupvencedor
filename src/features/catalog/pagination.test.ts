import { expect, it } from 'vitest'
import { getPageWindow } from './pagination'

it('returns only the items for the requested catalog page', () => {
  const result = getPageWindow(['a', 'b', 'c', 'd', 'e'], 2, 2)

  expect(result.items).toEqual(['c', 'd'])
  expect(result.currentPage).toBe(2)
  expect(result.totalPages).toBe(3)
})

it('moves back to the last valid page when filtering reduces the result set', () => {
  const result = getPageWindow(['a'], 3, 18)

  expect(result.currentPage).toBe(1)
  expect(result.totalPages).toBe(1)
})
