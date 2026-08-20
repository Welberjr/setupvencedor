import { expect, it } from 'vitest'
import { parseActivityInput } from './activity'

it('keeps only the allowed fields for a resource view', () => {
  expect(parseActivityInput({
    eventType: 'resource_opened',
    catalogItemId: '1d0934b0-9a48-4e4b-af75-26b063448f01',
    userId: 'forged-user-id',
    token: 'must-never-be-stored',
  })).toEqual({
    eventType: 'resource_opened',
    catalogItemId: '1d0934b0-9a48-4e4b-af75-26b063448f01',
  })
})

it('normalizes an explicit catalog search without accepting empty terms', () => {
  expect(parseActivityInput({ eventType: 'catalog_search', searchTerm: '  Cloudflare   Workers  ' })).toEqual({
    eventType: 'catalog_search',
    searchTerm: 'Cloudflare Workers',
  })
  expect(parseActivityInput({ eventType: 'catalog_search', searchTerm: '   ' })).toBeNull()
})

it('rejects a resource event without a catalog id', () => {
  expect(parseActivityInput({ eventType: 'resource_opened' })).toBeNull()
})
