import { useEffect, useState } from 'react'
import { workerUrl } from '../../lib/api/worker'
import { AuthArtwork } from '../handdrawn/AuthArtwork'
import type { VisualMode } from '../handdrawn/visual-mode'
import { invitationErrorMessage } from './invite-error-message'

type InvitePreview = { delivery: 'email' | 'direct_link'; email: string | null; recipientName: string | null }

export function ActivateInvitePage({ visualMode = 'command-center' }: { visualMode?: VisualMode }) {
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  useEffect(() => {
    if (!token) { setMessage('Este convite é inválido ou expirou.'); return }
    fetch(workerUrl('/v1/invitations/validate'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (response) => response.ok ? response.json() as Promise<InvitePreview> : Promise.reject())
      .then((data) => { setInvite(data); setEmail(data.email ?? ''); setName(data.recipientName ?? '') })
      .catch(() => setMessage('Este convite é inválido, já foi usado, revogado ou expirou.'))
  }, [token])

  async function activate(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 12) { setMessage('Use uma senha forte com pelo menos 12 caracteres.'); return }
    if (!email || !name.trim()) { setMessage('Informe seu nome e e-mail para concluir o acesso.'); return }
    setPending(true); setMessage('')
    try {
      const response = await fetch(workerUrl('/v1/invitations/activate'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password, email: invite?.delivery === 'direct_link' ? email : undefined, recipientName: name }) })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? '')
      }
      window.location.assign('/')
    } catch (error) { setMessage(invitationErrorMessage(error instanceof Error ? error.message : null)) } finally { setPending(false) }
  }

  const directLink = invite?.delivery === 'direct_link'
  const needsName = !invite?.recipientName
  return <main className={`app-shell auth-shell ${visualMode}`}>{visualMode === 'handdrawn-lab' ? <AuthArtwork /> : null}<form className="auth-form" onSubmit={activate}><p className="eyebrow">ATIVAR CONVITE</p><h1>Crie seu acesso.</h1><p className="activation-intro">{directLink ? 'Este link é individual. Informe seus dados para vinculá-lo à sua conta.' : 'Defina sua senha para entrar na biblioteca privada da equipe.'}</p>{directLink ? <label>E-mail<input aria-label="E-mail" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label> : <label>E-mail<input aria-label="E-mail" readOnly value={email} /></label>}{needsName ? <label>Seu nome<input aria-label="Seu nome" autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label> : <input aria-label="Seu nome" readOnly type="hidden" value={name} />}<label>Nova senha<input aria-label="Nova senha" autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} /><small>12+ caracteres, com maiúscula, minúscula, número e símbolo.</small></label>{message ? <p role="alert">{message}</p> : null}<button className="primary" disabled={!invite || pending} type="submit">{pending ? 'Criando acesso…' : 'Criar meu acesso'}</button></form></main>
}
