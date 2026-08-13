import { useState, type FormEvent } from 'react'

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<void> | void
  onForgotPassword?: (email: string) => Promise<void> | void
}

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message === 'supabase_not_configured') {
    return 'Configuração de autenticação não disponível nesta instalação. Atualize a página e tente de novo.'
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('invalid email or password') ||
    message.includes('not allowed to sign in')
  ) {
    return 'E-mail ou senha incorretos.'
  }

  if (message.includes('email not confirmed') || message.includes('email confirmation')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada.'
  }

  if (
    message.includes('over sms limit') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'Muitas tentativas de acesso. Tente novamente em alguns minutos.'
  }

  return 'Não foi possível entrar. Confira seus dados e tente novamente.'
}

export function LoginForm({ onLogin, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Informe um e-mail válido.')
      return
    }
    if (!password) {
      setError('Informe sua senha.')
      return
    }

    setError('')
    setIsSending(true)
    try {
      await onLogin(normalizedEmail, password)
    } catch (authError) {
      setError(getLoginErrorMessage(authError))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <p className="eyebrow">ACESSO PRIVADO</p>
      <h1>Bem-vindo de volta.</h1>
      <label>
        E-mail
        <input
          aria-label="E-mail"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Senha
        <input
          aria-label="Senha"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button className="primary" disabled={isSending} type="submit">
        {isSending ? 'Entrando...' : 'Entrar'}
      </button>
      <button
        className="link-button"
        onClick={() => {
          const normalizedEmailOnForgot = email.trim().toLowerCase()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmailOnForgot)) {
            setError('Informe seu e-mail para recuperar a senha.')
            return
          }
          onForgotPassword?.(normalizedEmailOnForgot)
        }}
        type="button"
      >
        Esqueci minha senha
      </button>
    </form>
  )
}
