import { expect, it } from 'vitest'
import { buildActivityEvent } from './activity'

it('normalizes a submitted catalog search before it is tracked', () => {
  expect(buildActivityEvent('catalog_search', { searchTerm: '  Cloudflare   Workers  ' })).toEqual({
    eventType: 'catalog_search',
    searchTerm: 'Cloudflare Workers',
  })
})

it('does not emit empty searches or a browser supplied person id', () => {
  expect(buildActivityEvent('catalog_search', { searchTerm: '   ', userId: 'forged-user-id' })).toBeNull()
})
