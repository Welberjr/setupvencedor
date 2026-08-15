import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { PublicAccessPage } from './PublicAccessPage'

it('makes the free signup path mobile-friendly and collects only the required contact data', async () => {
  const user = userEvent.setup()
  render(<PublicAccessPage onLogin={vi.fn()} onSignUp={vi.fn()} />)

  expect(screen.getByText(/100% gratuito/i)).toBeInTheDocument()
  expect(screen.getByLabelText('Nome completo')).toBeRequired()
  expect(screen.getByLabelText('E-mail')).toBeRequired()
  expect(screen.getByLabelText('Telefone')).not.toBeRequired()
  expect(screen.getByRole('link', { name: /Comunidade no WhatsApp/i })).toHaveAttribute('href', 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr')

  await user.click(screen.getByRole('button', { name: 'Já tenho uma conta' }))
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})

it('explains the password rule before sending a signup that Auth would reject', async () => {
  const user = userEvent.setup()
  const onSignUp = vi.fn()
  render(<PublicAccessPage onLogin={vi.fn()} onSignUp={onSignUp} />)

  await user.type(screen.getByLabelText('Nome completo'), 'Ana Pessoa')
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'somenteletras')
  await user.click(screen.getByRole('button', { name: 'Criar meu acesso grátis' }))

  expect(screen.getByText('Use letras e números na sua senha.')).toBeInTheDocument()
  expect(onSignUp).not.toHaveBeenCalled()
})
