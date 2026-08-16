import { expect, it } from 'vitest'
import { authCallbackErrorMessage } from './auth-callback-error'

it('turns a Supabase confirmation error into a helpful recovery message', () => {
  expect(authCallbackErrorMessage('#error=server_error&error_code=unexpected_failure')).toBe('Não conseguimos confirmar seu e-mail desta vez. Solicite um novo e-mail de confirmação e tente novamente.')
})

it('does not show an error when the callback has no error fragment', () => {
  expect(authCallbackErrorMessage('#access_token=example')).toBeNull()
})
