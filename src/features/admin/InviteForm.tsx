import { useState, type FormEvent } from 'react'
import { workerUrl } from '../../lib/api/worker'
import type { Role } from '../../lib/roles'

export function InviteForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    const { data: { session } } = await (await import('../../lib/supabase/client')).getSupabaseClient()!.auth.getSession()
    if (!session) { setMessage('Sua sessão expirou. Entre novamente.'); return }
    const response = await fetch(workerUrl('/v1/invitations'), { method: 'POST', headers: { authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ email, recipientName: name, roles: [role] }) })
    setMessage(response.ok ? 'Convite criado. Ele será enviado quando o remetente Resend estiver verificado.' : 'Não foi possível criar esse convite.')
    if (response.ok) { setEmail(''); setName('') }
  }
  return <form className="ticket-form compact" onSubmit={submit}><p className="eyebrow">CONVIDAR PESSOA</p><label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Papel<select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="member">Membro</option><option value="editor">Editor</option><option value="manager">Gestor</option><option value="admin">Administrador</option></select></label><button className="primary" type="submit">Criar convite</button>{message ? <p aria-live="polite">{message}</p> : null}</form>
}
