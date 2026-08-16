import { expect, it } from 'vitest'
import { invitationErrorMessage } from './invite-error-message'

it('explains when an invitation activation link is no longer usable', () => {
  expect(invitationErrorMessage('invalid_or_expired_invitation')).toBe('Este convite já foi usado, revogado ou expirou. Peça um novo link ao administrador.')
})

it('keeps a recoverable activation failure distinct from an invalid invitation', () => {
  expect(invitationErrorMessage('activation_not_completed')).toBe('Não conseguimos criar seu acesso agora. Tente novamente em alguns instantes sem fechar esta página.')
})
