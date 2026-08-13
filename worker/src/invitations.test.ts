import { expect, it } from 'vitest'
import { normalizeEmail, validateInviteInput } from './invitations'

it('normalizes invitation email addresses', () => {
  expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com')
})

it('rejects an empty invitation email address', () => {
  expect(() => normalizeEmail('  ')).toThrow('invalid_email')
})

it('accepts an email invitation without a prefilled name', () => {
  expect(validateInviteInput({ delivery: 'email', email: 'dev@example.com', roles: ['member'] })).toMatchObject({
    delivery: 'email',
    email: 'dev@example.com',
    roles: ['member'],
  })
})

it('accepts a direct link without email or recipient name', () => {
  expect(validateInviteInput({ delivery: 'direct_link', roles: ['editor'] })).toMatchObject({ delivery: 'direct_link', roles: ['editor'] })
})
