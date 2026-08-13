import { useState, type FormEvent } from 'react'
import { workerUrl } from '../../lib/api/worker'
import type { Role } from '../../lib/roles'
import { getSupabaseClient } from '../../lib/supabase/client'

type Delivery = 'email' | 'direct_link'

export function InviteForm({ onCreated }: { onCreated?: () => void }) {
  const [delivery, setDelivery] = useState<Delivery>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [message, setMessage] = useState('')
  const [activationUrl, setActivationUrl] = useState('')
  const [pending, setPending] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(activationUrl)
    setMessage('Link copiado. Ele expira em 72 horas e só pode ser usado uma vez.')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const client = getSupabaseClient()
    if (!client) { setMessage('A conexão segura ainda não está configurada.'); return }
    const { data: { session } } = await client.auth.getSession()
    if (!session) { setMessage('Sua sessão expirou. Entre novamente.'); return }
    setPending(true); setMessage(''); setActivationUrl('')
    try {
      const response = await fetch(workerUrl('/v1/invitations'), {
        method: 'POST',
        headers: { authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ delivery, email: delivery === 'email' ? email : undefined, recipientName: name || undefined, jobTitle: jobTitle || undefined, roles: [role] }),
      })
      const payload = await response.json().catch(() => ({})) as { activationUrl?: string; emailDelivered?: boolean }
      if (!response.ok) throw new Error()
      if (payload.activationUrl) {
        setActivationUrl(payload.activationUrl)
        setMessage('Link seguro gerado. Copie e envie apenas para a pessoa convidada.')
      } else if (payload.emailDelivered) {
        setMessage('Convite enviado. Se não chegar, use Reenviar na lista de acessos.')
      } else {
        setMessage('Convite criado, mas a entrega por e-mail ainda precisa de um remetente Resend verificado. Você pode reenviar depois.')
      }
      setEmail(''); setName(''); setJobTitle(''); onCreated?.()
    } catch {
      setMessage('Não foi possível criar este convite. Verifique os dados e tente novamente.')
    } finally { setPending(false) }
  }

  return <section className="invite-studio" aria-labelledby="invite-title">
    <div className="invite-heading"><div><p className="eyebrow">NOVO ACESSO</p><h2 id="invite-title">Convide do seu jeito.</h2><p>Envie por e-mail ou gere um link único para alguém de confiança.</p></div><span className="invite-expiry">EXPIRA EM 72H</span></div>
    <form className="ticket-form invite-form" onSubmit={submit}>
      <fieldset className="delivery-picker"><legend>Forma de convite</legend><label className={delivery === 'email' ? 'selected' : ''}><input checked={delivery === 'email'} name="delivery" onChange={() => setDelivery('email')} type="radio" value="email" /><span><strong>Enviar por e-mail</strong><small>Para um acesso identificado.</small></span></label><label className={delivery === 'direct_link' ? 'selected' : ''}><input checked={delivery === 'direct_link'} name="delivery" onChange={() => setDelivery('direct_link')} type="radio" value="direct_link" /><span><strong>Gerar link direto</strong><small>Para compartilhar com alguém de confiança.</small></span></label></fieldset>
      <div className="form-columns">
        {delivery === 'email' ? <label>E-mail<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label> : <div className="direct-link-note"><strong>Link de uso único</strong><span>A pessoa informa o próprio e-mail ao ativar. O endereço é invalidado após o primeiro uso.</span></div>}
        <label>Nome <small>Opcional</small><input onChange={(event) => setName(event.target.value)} placeholder="Se vazio, a pessoa preenche" value={name} /></label>
        <label>Cargo <small>Opcional</small><input onChange={(event) => setJobTitle(event.target.value)} placeholder="Ex.: Desenvolvedor" value={jobTitle} /></label>
        <label>Papel<select onChange={(event) => setRole(event.target.value as Role)} value={role}><option value="member">Membro</option><option value="editor">Editor</option><option value="manager">Gestor</option><option value="admin">Administrador</option></select></label>
      </div>
      <button className="primary" disabled={pending} type="submit">{pending ? 'Criando acesso…' : delivery === 'email' ? 'Enviar convite' : 'Gerar link seguro'}</button>
      {activationUrl ? <div className="activation-link"><code>{activationUrl}</code><button onClick={() => void copyLink()} type="button">Copiar link</button></div> : null}
      {message ? <p aria-live="polite" className="form-message">{message}</p> : null}
    </form>
  </section>
}
