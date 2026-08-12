import { useState, type FormEvent } from 'react'

type LoginFormProps = { onLogin: (email: string, password: string) => Promise<void> | void }

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return }
    if (!password) { setError('Informe sua senha.'); return }
    setError(''); setIsSending(true)
    try { await onLogin(email.trim().toLowerCase(), password) } catch { setError('Não foi possível entrar. Confira seus dados e tente novamente.') } finally { setIsSending(false) }
  }
  return <form className="auth-form" onSubmit={submit} noValidate><p className="eyebrow">ACESSO PRIVADO</p><h1>Bem-vindo de volta.</h1><label>E-mail<input aria-label="E-mail" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<input aria-label="Senha" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error ? <p role="alert">{error}</p> : null}<button className="primary" disabled={isSending} type="submit">{isSending ? 'Entrando...' : 'Entrar'}</button><button className="link-button" type="button">Esqueci minha senha</button></form>
}
