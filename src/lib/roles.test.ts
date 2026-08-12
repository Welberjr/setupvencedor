import { expect, it } from 'vitest'
import { hasAnyRole } from './roles'

it('grants access when one required role is held', () => {
  expect(hasAnyRole(['member', 'editor'], ['manager', 'editor'])).toBe(true)
})

it('denies access when no required role is held', () => {
  expect(hasAnyRole(['member'], ['admin'])).toBe(false)
})
