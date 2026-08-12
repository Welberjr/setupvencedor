import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

it('requires a valid email before attempting login', async () => {
  const user = userEvent.setup()
  const onLogin = vi.fn()
  render(<LoginForm onLogin={onLogin} />)
  await user.type(screen.getByLabelText('E-mail'), 'invalido')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(screen.getByText('Informe um e-mail válido.')).toBeVisible()
  expect(onLogin).not.toHaveBeenCalled()
})
