import { useEffect, useState } from 'react'
import { workerUrl } from '../../lib/api/worker'

export function ActivateInvitePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  useEffect(() => {
    if (!token) { setMessage('Este convite é inválido ou expirou.'); return }
    fetch(workerUrl('/v1/invitations/validate'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setEmail(data.email))
      .catch(() => setMessage('Este convite é inválido, já foi usado ou expirou.'))
  }, [token])
  async function activate(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 12) { setMessage('Use uma senha forte com pelo menos 12 caracteres.'); return }
    const response = await fetch(workerUrl('/v1/invitations/activate'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) })
    if (!response.ok) { setMessage('Não foi possível concluir seu acesso. Solicite um novo convite.'); return }
    window.location.assign('/')
  }
  return <main className="app-shell"><form className="auth-form" onSubmit={activate}><p className="eyebrow">ATIVAR CONVITE</p><h1>Crie seu acesso.</h1><label>E-mail<input readOnly value={email} aria-label="E-mail" /></label><label>Nova senha<input aria-label="Nova senha" autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message ? <p role="alert">{message}</p> : null}<button className="primary" disabled={!email} type="submit">Criar meu acesso</button></form></main>
}
