import { expect, it } from 'vitest'
import { pilotGuideForItem } from './pilot-guide-data'

it('provides authored fallback content while the guide migration is pending', () => {
  const guide = pilotGuideForItem('skills-frontend-design', 'item-1')

  expect(guide?.catalogItemId).toBe('item-1')
  expect(guide?.plainLanguage).toMatch(/diretor de arte/i)
  expect(pilotGuideForItem('recurso-ausente', 'item-2')).toBeUndefined()
})
