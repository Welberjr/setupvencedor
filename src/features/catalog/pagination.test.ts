import { expect, it } from 'vitest'
import { ASSISTANT_RESULTS_PAGE_SIZE, getPageWindow } from './pagination'

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

it('keeps assistant searches to ten cards per page', () => {
  const result = getPageWindow(Array.from({ length: 23 }, (_, index) => `item-${index + 1}`), 1, ASSISTANT_RESULTS_PAGE_SIZE)

  expect(result.items).toHaveLength(10)
  expect(result.totalPages).toBe(3)
})
