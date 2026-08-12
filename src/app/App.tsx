import { useMemo, useState } from 'react'
import { FavoriteButton } from '../features/catalog/FavoriteButton'
import { sampleCatalog } from '../features/catalog/catalog-data'

type Session = { user: { id: string; email: string } } | null

export function App({ session = null }: { session?: Session }) {
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
      {page === 'support' ? <section className="hero"><p className="eyebrow">SUPORTE</p><h1>Precisando de uma mão?</h1><p>Abra um chamado de acesso, dúvida, bug ou sugestão e acompanhe a resposta aqui.</p><button className="primary">Abrir chamado</button></section> : null}
    </main>
  )
}
