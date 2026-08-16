import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { PublicAccessPage } from './PublicAccessPage'

vi.mock('./TurnstileChallenge', () => ({
  TurnstileChallenge: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => <button onClick={() => onTokenChange('verified-token')} type="button">Concluir verificação de segurança</button>,
}))

it('makes the free signup path mobile-friendly and collects only the required contact data', async () => {
  const user = userEvent.setup()
  render(<PublicAccessPage onLogin={vi.fn()} onSignUp={vi.fn()} />)

  expect(screen.getByText(/100% gratuito/i)).toBeInTheDocument()
  expect(screen.getByLabelText('Nome completo')).toBeRequired()
  expect(screen.getByLabelText('E-mail')).toBeRequired()
  expect(screen.getByLabelText('Telefone')).not.toBeRequired()
  expect(screen.getByText('Use pelo menos 8 caracteres, com letras e números.')).toBeInTheDocument()
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

it('requires consent and a verified Turnstile token before creating a public account', async () => {
  const user = userEvent.setup()
  const onSignUp = vi.fn()
  render(<PublicAccessPage onLogin={vi.fn()} onSignUp={onSignUp} />)

  await user.type(screen.getByLabelText('Nome completo'), 'Ana Pessoa')
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha123')
  await user.click(screen.getByRole('button', { name: 'Criar meu acesso grátis' }))
  expect(screen.getByText(/aceite os termos de uso/i)).toBeInTheDocument()

  await user.click(screen.getByRole('checkbox', { name: /aceito os termos de uso/i }))
  await user.click(screen.getByRole('button', { name: 'Criar meu acesso grátis' }))
  expect(screen.getByText(/conclua a verificação de segurança/i)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Concluir verificação de segurança' }))
  await user.click(screen.getByRole('button', { name: 'Criar meu acesso grátis' }))

  expect(onSignUp).toHaveBeenCalledWith({
    captchaToken: 'verified-token',
    email: 'ana@example.com',
    fullName: 'Ana Pessoa',
    password: 'senha123',
    phone: '',
    termsAccepted: true,
    termsVersion: '2026-08-15',
  })
})

it('sends the verified Turnstile token when entering or recovering a public account', async () => {
  const user = userEvent.setup()
  const onLogin = vi.fn()
  const onForgotPassword = vi.fn()
  render(<PublicAccessPage onForgotPassword={onForgotPassword} onLogin={onLogin} onSignUp={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Já tenho uma conta' }))
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha123')
  await user.click(screen.getByRole('button', { name: 'Concluir verificação de segurança' }))
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(onLogin).toHaveBeenCalledWith('ana@example.com', 'senha123', 'verified-token')

  await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
  await user.click(screen.getByRole('button', { name: 'Concluir verificação de segurança' }))
  await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }))
  expect(onForgotPassword).toHaveBeenCalledWith('ana@example.com', 'verified-token')
})

it('explains a temporary email sending limit without exposing provider details', async () => {
  const user = userEvent.setup()
  const onSignUp = vi.fn().mockRejectedValue(new Error('email rate limit exceeded'))
  render(<PublicAccessPage onLogin={vi.fn()} onSignUp={onSignUp} />)

  await user.type(screen.getByLabelText('Nome completo'), 'Ana Pessoa')
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha123')
  await user.click(screen.getByRole('checkbox', { name: /aceito os termos de uso/i }))
  await user.click(screen.getByRole('button', { name: 'Concluir verificação de segurança' }))
  await user.click(screen.getByRole('button', { name: 'Criar meu acesso grátis' }))

  expect(screen.getByText('Aguarde alguns minutos antes de pedir outro e-mail de confirmação.')).toBeInTheDocument()
})
