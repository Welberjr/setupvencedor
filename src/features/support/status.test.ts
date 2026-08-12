import { expect, it } from 'vitest'
import { canTransitionTicket } from './status'

it('allows managers to answer an open ticket', () => {
  expect(canTransitionTicket('open', 'answered', ['manager'])).toBe(true)
})

it('prevents members from finalizing a ticket', () => {
  expect(canTransitionTicket('open', 'finalized', ['member'])).toBe(false)
})

it('prevents reopening a finalized ticket', () => {
  expect(canTransitionTicket('finalized', 'open', ['admin'])).toBe(false)
})
