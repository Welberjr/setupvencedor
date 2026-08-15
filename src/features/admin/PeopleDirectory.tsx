import { useCallback, useEffect, useState } from 'react'
import { workerUrl } from '../../lib/api/worker'
import { getSupabaseClient } from '../../lib/supabase/client'

type Person = { id: string; email_normalized: string; full_name: string; phone: string | null; job_title: string | null; state: 'active' | 'disabled'; created_at: string; last_seen_at: string | null; roles: string[] }
type Invitation = { id: string; delivery: 'email' | 'direct_link'; email_normalized: string | null; recipient_name: string | null; job_title: string | null; roles: string[]; state: 'pending' | 'claimed'; expires_at: string }

function directoryLoadMessage(status?: number): string {
  if (status === 401) return 'Sua sessão expirou. Entre novamente para consultar os acessos.'
  if (status === 403) return 'Seu usuário não tem permissão para consultar os acessos.'
  return 'Não foi possível carregar os acessos. Tente novamente em instantes.'
}

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const client = getSupabaseClient()
  const { data: { session } } = await client?.auth.getSession() ?? { data: { session: null } }
  if (!session) throw new Error('session_expired')
  return fetch(workerUrl(path), { ...init, headers: { authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json', ...(init.headers ?? {}) } })
}

export function PeopleDirectory({ refreshKey, currentUserId }: { refreshKey: number; currentUserId: string }) {
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [peopleTotal, setPeopleTotal] = useState(0)
  const [invitationsTotal, setInvitationsTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 20>(10)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (search = query, nextPage = page, nextPageSize = pageSize) => {
    setLoading(true)
    try {
      const response = await authorizedFetch(`/v1/admin/people?query=${encodeURIComponent(search)}&page=${nextPage}&pageSize=${nextPageSize}`)
      if (!response.ok) throw new Error(String(response.status))
      const data = await response.json() as { people: Person[]; invitations: Invitation[]; peopleTotal: number; invitationsTotal: number; page: number; pageSize: 10 | 20 }
      setPeople(data.people); setInvitations(data.invitations); setPeopleTotal(data.peopleTotal); setInvitationsTotal(data.invitationsTotal); setPage(data.page); setPageSize(data.pageSize); setMessage('')
    } catch (error) {
      const status = error instanceof Error ? Number(error.message) : undefined
      setMessage(directoryLoadMessage(status))
    } finally { setLoading(false) }
  }, [page, pageSize, query])

  useEffect(() => { void load('', 1, pageSize) }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  async function action(path: string, method = 'POST', label = 'Alteração salva.', body?: unknown) {
    try {
      const response = await authorizedFetch(path, { method, body: body ? JSON.stringify(body) : undefined })
      const payload = await response.json().catch(() => ({})) as { activationUrl?: string; emailDelivered?: boolean }
      if (!response.ok) throw new Error()
      if (payload.activationUrl) {
        await navigator.clipboard.writeText(payload.activationUrl)
        setMessage('Novo link copiado. O link anterior foi revogado.')
      } else if (path.endsWith('/resend') && payload.emailDelivered === false) setMessage('Novo convite criado, mas o remetente Resend ainda não está verificado.')
      else setMessage(label)
      await load(query, page, pageSize)
    } catch { setMessage('Não foi possível concluir esta ação.') }
  }

  const totalPages = Math.max(1, Math.ceil(Math.max(peopleTotal, invitationsTotal) / pageSize))
  const formatLastAccess = (value: string | null) => value ? `Último acesso: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))}` : 'Ainda não acessou'

  return <section className="people-directory" aria-labelledby="people-title">
    <div className="directory-heading"><div><p className="eyebrow">GESTÃO DE ACESSOS</p><h2 id="people-title">Pessoas e convites.</h2><p className="directory-total"><strong>{peopleTotal} pessoas</strong><span> · {invitationsTotal} convites</span></p></div><div className="directory-controls"><label className="people-search"><span className="sr-only">Buscar pessoa</span><input onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(query, 1, pageSize) }} placeholder="Buscar por nome ou e-mail" value={query} /><button onClick={() => void load(query, 1, pageSize)} type="button">Buscar</button></label><label className="directory-page-size">Por página<select aria-label="Pessoas por página" onChange={(event) => void load(query, 1, Number(event.target.value) as 10 | 20)} value={pageSize}><option value={10}>10</option><option value={20}>20</option></select></label></div></div>
    {message ? <p aria-live="polite" className="form-message">{message}</p> : null}
    <div className="directory-columns">
      <div className="directory-panel"><div className="directory-panel-title"><h3>Acessos</h3><span>{peopleTotal}</span></div>{loading ? <p>Carregando…</p> : people.length ? <ul className="access-list">{people.map((person) => <li key={person.id}><div className="person-avatar">{person.full_name.slice(0, 1).toUpperCase()}</div><div className="person-summary"><strong>{person.full_name}</strong><span>{person.email_normalized}</span><small>{person.phone || 'Sem telefone'} · {formatLastAccess(person.last_seen_at)}</small><small>{person.roles.join(' · ') || 'Membro'}{person.job_title ? ` · ${person.job_title}` : ''}</small></div><div className="person-actions">{person.id === currentUserId ? <small>Você</small> : <>{person.state === 'active' ? <button onClick={() => void action(`/v1/admin/people/${person.id}/access`, 'POST', 'Acesso bloqueado e sessões encerradas.', { state: 'disabled' })} type="button">Bloquear</button> : <button onClick={() => void action(`/v1/admin/people/${person.id}/access`, 'POST', 'Acesso reativado.', { state: 'active' })} type="button">Reativar</button>}<button className="danger" onClick={() => { if (window.confirm(`Excluir ${person.full_name}? Esta ação não pode ser desfeita.`)) void action(`/v1/admin/people/${person.id}`, 'DELETE', 'Pessoa excluída.')}} type="button">Excluir</button></>}</div></li>)}</ul> : <p>Nenhuma pessoa encontrada.</p>}</div>
      <div className="directory-panel"><div className="directory-panel-title"><h3>Convites pendentes</h3><span>{invitationsTotal}</span></div>{loading ? <p>Carregando…</p> : invitations.length ? <ul className="access-list invitation-list">{invitations.map((invite) => <li key={invite.id}><div className="person-avatar pending">{invite.delivery === 'email' ? '@' : '↗'}</div><div className="person-summary"><strong>{invite.recipient_name || 'Nome será informado na ativação'}</strong><span>{invite.email_normalized || 'Link direto de uso único'}</span><small>{invite.roles.join(' · ')} · expira em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(invite.expires_at))}</small></div><div className="person-actions">{invite.delivery === 'email' ? <button onClick={() => void action(`/v1/admin/invitations/${invite.id}/resend`, 'POST', 'Novo convite enviado por e-mail.')} type="button">Reenviar</button> : <button onClick={() => void action(`/v1/admin/invitations/${invite.id}/regenerate`, 'POST')} type="button">Novo link</button>}<button className="danger" onClick={() => void action(`/v1/admin/invitations/${invite.id}/revoke`, 'POST', 'Convite revogado.')} type="button">Revogar</button></div></li>)}</ul> : <p>Nenhum convite pendente.</p>}</div>
    </div>
    <nav aria-label="Paginação de pessoas" className="directory-pagination"><button disabled={loading || page <= 1} onClick={() => void load(query, page - 1, pageSize)} type="button">← Anterior</button><span>Página {page} de {totalPages}</span><button disabled={loading || page >= totalPages} onClick={() => void load(query, page + 1, pageSize)} type="button">Próxima →</button></nav>
  </section>
}
