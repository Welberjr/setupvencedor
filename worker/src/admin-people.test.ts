import { expect, it } from 'vitest'
import { parsePeoplePagination } from './admin-people'

it('uses a compact first page and only accepts the administration page sizes', () => {
  expect(parsePeoplePagination(new URLSearchParams())).toEqual({ page: 1, pageSize: 10 })
  expect(parsePeoplePagination(new URLSearchParams('page=4&pageSize=20'))).toEqual({ page: 4, pageSize: 20 })
  expect(parsePeoplePagination(new URLSearchParams('page=-1&pageSize=80'))).toEqual({ page: 1, pageSize: 10 })
})
