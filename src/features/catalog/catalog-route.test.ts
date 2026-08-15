import { expect, it } from 'vitest'
import { readResourceSlug, resourcePath } from './catalog-route'

it('reads and creates a valid resource profile path', () => {
  expect(readResourceSlug('/recurso/skills-frontend-design')).toBe('skills-frontend-design')
  expect(resourcePath('mcps-context7')).toBe('/recurso/mcps-context7')
  expect(readResourceSlug('/explorar')).toBeNull()
})
