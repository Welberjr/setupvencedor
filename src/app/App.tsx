import { useMemo, useState } from 'react'
import { FavoriteButton } from '../features/catalog/FavoriteButton'
import { sampleCatalog } from '../features/catalog/catalog-data'
import { LoginForm } from '../features/auth/LoginForm'
import { getSupabaseClient } from '../lib/supabase/client'
import { TicketForm } from '../features/support/TicketForm'
import { ActivateInvitePage } from '../features/auth/ActivateInvitePage'

type Session = { user: { id: string; email: string } } | null

export function App({ session = null }: { session?: Session }) {
  if (window.location.pathname === '/ativar') return <ActivateInvitePage />
  if (!session) {
    return <main className="app-shell"><LoginForm onLogin={async (email, password) => {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('supabase_not_configured')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.reload()
    }} onForgotPassword={async (email) => {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('supabase_not_configured')
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` })
      if (error) throw error
    }} /></main>
  }
  const [query, setQuery] = useState('')
  const [page, setPage] = useState<'explore' | 'assistant' | 'favorites' | 'support'>('explore')
  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return normalized ? sampleCatalog.filter((item) => `${item.title} ${item.summary} ${item.tags.join(' ')} ${item.topics.join(' ')}`.toLowerCase().includes(normalized)) : sampleCatalog
  }, [query])
  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/">Setup Vencedor</a>
        {session ? <span className="identity">{session.user.email}</span> : null}
      </header>
      <nav aria-label="Principal" className="main-nav">
        <button onClick={() => setPage('explore')}>Explorar</button>
        <button onClick={() => setPage('assistant')}>Assistente</button>
        <button onClick={() => setPage('favorites')}>Favoritos</button>
        <button onClick={() => setPage('support')}>Suporte</button>
      </nav>
      {page === 'explore' ? <section className="hero">
        <p className="eyebrow">CENTRAL DE CONHECIMENTO</p>
        <h1>Encontre a melhor ferramenta para o próximo passo.</h1>
        <label className="search"><span>Buscar no acervo</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: design, documentação, testes" /></label>
        <div className="catalog-grid">{results.map((item) => <article className="catalog-card" key={item.id}><p className="eyebrow">{item.type} · {item.category}</p><h2>{item.title}</h2><p>{item.summary}</p><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><a href={item.officialUrl} rel="noreferrer" target="_blank">Abrir fonte oficial ↗</a><FavoriteButton title={item.title} /></article>)}</div>
      </section> : null}
      {page === 'assistant' ? <section className="hero"><p className="eyebrow">ASSISTENTE DO ACERVO</p><h1>Diga o que você quer resolver.</h1><p>O assistente encontra itens por tema, tags e problema resolvido, sem inventar respostas.</p></section> : null}
      {page === 'favorites' ? <section className="hero"><p className="eyebrow">SEUS FAVORITOS</p><h1>Seu atalho para o que importa.</h1><p>Os itens salvos ficam sincronizados com a sua conta quando o Supabase for conectado.</p></section> : null}
      {page === 'support' ? <section className="hero"><p className="eyebrow">SUPORTE</p><h1>Precisando de uma mão?</h1><p>Abra um chamado de acesso, dúvida, bug ou sugestão e acompanhe a resposta aqui.</p><TicketForm onCreate={async (ticket) => {
        const supabase = getSupabaseClient()
        if (!supabase) return
        const { data: created } = await supabase.from('support_tickets').insert({ requester_id: session.user.id, subject: ticket.subject, type: ticket.type }).select('id').single()
        if (created) await supabase.from('support_messages').insert({ ticket_id: created.id, author_id: session.user.id, body: ticket.body })
      }} /></section> : null}
    </main>
  )
}
