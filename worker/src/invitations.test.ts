import { expect, it } from 'vitest'
import { normalizeEmail } from './invitations'

it('normalizes invitation email addresses', () => {
  expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com')
})

it('rejects an empty invitation email address', () => {
  expect(() => normalizeEmail('  ')).toThrow('invalid_email')
})
