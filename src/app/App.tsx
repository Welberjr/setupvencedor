import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Search, Sparkles } from 'lucide-react'
import { BrandMark } from '../features/brand/BrandMark'
import { CommandIcon, type CommandIconName } from '../features/brand/CommandIcon'
import { FavoriteButton } from '../features/catalog/FavoriteButton'
import { PublicSources } from '../features/catalog/PublicSources'
import { CatalogDetailPanel } from '../features/catalog/CatalogDetailPanel'
import { CatalogPagination } from '../features/catalog/CatalogPagination'
import { getPageWindow } from '../features/catalog/pagination'
import { useCatalogPageSize } from '../features/catalog/useCatalogPageSize'
import { createCardSummary } from '../features/catalog/catalog-narrative'
import { AssistantSearch } from '../features/catalog/AssistantSearch'
import { sampleCatalog } from '../features/catalog/catalog-data'
import type { CatalogItem } from '../features/catalog/types'
import { LoginForm } from '../features/auth/LoginForm'
import { getSupabaseClient } from '../lib/supabase/client'
import { TicketForm } from '../features/support/TicketForm'
import { ActivateInvitePage } from '../features/auth/ActivateInvitePage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { InviteForm } from '../features/admin/InviteForm'
import { PeopleDirectory } from '../features/admin/PeopleDirectory'
import { hasAnyRole, type Role } from '../lib/roles'
import { PwaInstallPrompt } from '../features/pwa/PwaInstallPrompt'

type Session = { user: { id: string; email: string }; roles?: Role[] } | null
type Page = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin'

type CatalogRow = {
  id: string; slug: string; title: string; item_type: string; summary: string; own_content: string; official_url: string; instructions: string
  status: CatalogItem['status']; visibility: CatalogItem['visibility']; categories: { name: string } | null
  catalog_item_topics: Array<{ topics: { name: string } | null }>; catalog_item_tags: Array<{ tags: { name: string } | null }>; catalog_item_sources: Array<{ source_url: string }>
}

function toCatalogItem(row: CatalogRow): CatalogItem {
  return { id: row.id, slug: row.slug, title: row.title, type: row.item_type, summary: row.summary, ownContent: row.own_content, officialUrl: row.official_url, sourceUrls: row.catalog_item_sources.map((source) => source.source_url), instructions: row.instructions, status: row.status, visibility: row.visibility, category: row.categories?.name ?? 'Acervo', topics: row.catalog_item_topics.map((item) => item.topics?.name).filter((name): name is string => Boolean(name)), tags: row.catalog_item_tags.map((item) => item.tags?.name).filter((name): name is string => Boolean(name)) }
}

const navItems: Array<{ id: Page; label: string; icon: CommandIconName }> = [
  { id: 'explore', label: 'Explorar', icon: 'explore' }, { id: 'assistant', label: 'Assistente', icon: 'assistant' }, { id: 'favorites', label: 'Favoritos', icon: 'favorites' }, { id: 'support', label: 'Suporte', icon: 'support' },
]
export function App({ session = null }: { session?: Session }) {
  if (window.location.pathname === '/ativar') return <ActivateInvitePage />
  if (window.location.pathname === '/redefinir-senha') return <ResetPasswordPage />
  if (!session) return <main className="app-shell auth-shell"><LoginForm onLogin={async (email, password) => { const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured'); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error }} onForgotPassword={async (email) => { const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured'); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` }); if (error) throw error }} /></main>
  const authenticatedSession = session

  const [query, setQuery] = useState('')
  const [page, setPage] = useState<Page>('explore')
  const [catalog, setCatalog] = useState<CatalogItem[]>(sampleCatalog)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [catalogStatus, setCatalogStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [catalogPage, setCatalogPage] = useState(1)
  const [accessRefreshKey, setAccessRefreshKey] = useState(0)
  const catalogPageSize = useCatalogPageSize()

  useEffect(() => {
    const supabase = getSupabaseClient(); if (!supabase) return
    const catalogClient = supabase
    let active = true
    async function loadCatalog() {
      const [{ data: itemRows, error: itemsError }, { data: favoriteRows, error: favoritesError }] = await Promise.all([
        catalogClient.from('catalog_items').select('id,slug,title,item_type,summary,own_content,official_url,instructions,status,visibility,categories(name),catalog_item_topics(topics(name)),catalog_item_tags(tags(name)),catalog_item_sources(source_url)').eq('status', 'published').order('published_at', { ascending: false }),
        catalogClient.from('favorites').select('catalog_item_id').eq('user_id', authenticatedSession.user.id),
      ])
      if (!active) return
      if (itemsError || favoritesError) { setCatalogStatus('Não foi possível sincronizar o acervo agora. Tente novamente em instantes.'); return }
      setCatalog((itemRows as unknown as CatalogRow[]).map(toCatalogItem)); setFavoriteIds(new Set((favoriteRows ?? []).map((row) => row.catalog_item_id)))
    }
    void loadCatalog(); return () => { active = false }
  }, [authenticatedSession.user.id])

  const categories = useMemo(() => [...new Set(catalog.map((item) => item.category))].sort((first, second) => first.localeCompare(second)), [catalog])
  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return catalog.filter((item) => (!selectedCategory || item.category === selectedCategory) && (!normalized || `${item.title} ${item.summary} ${item.ownContent} ${item.tags.join(' ')} ${item.topics.join(' ')}`.toLowerCase().includes(normalized)))
  }, [catalog, query, selectedCategory])
  const favoriteItems = useMemo(() => catalog.filter((item) => favoriteIds.has(item.id)), [catalog, favoriteIds])

  async function toggleFavorite(itemId: string) {
    const supabase = getSupabaseClient(); if (!supabase) return
    const wasFavorite = favoriteIds.has(itemId)
    setFavoriteIds((current) => { const next = new Set(current); wasFavorite ? next.delete(itemId) : next.add(itemId); return next })
    const request = wasFavorite ? supabase.from('favorites').delete().eq('user_id', authenticatedSession.user.id).eq('catalog_item_id', itemId) : supabase.from('favorites').insert({ user_id: authenticatedSession.user.id, catalog_item_id: itemId })
    const { error } = await request
    if (error) { setFavoriteIds((current) => { const next = new Set(current); wasFavorite ? next.add(itemId) : next.delete(itemId); return next }); setCatalogStatus('Não foi possível atualizar seus favoritos. Tente novamente.') }
  }

  const renderCatalog = (items: CatalogItem[]) => {
    const pageWindow = getPageWindow(items, catalogPage, catalogPageSize)
    return <><div className="catalog-grid">{pageWindow.items.map((item) => <article className={`catalog-card type-${item.type.toLowerCase().replaceAll(' ', '-')}`} key={item.id}><div className="card-topline"><p className="eyebrow">{item.type}</p><span>{item.category}</span></div><h2>{item.title}</h2><p>{createCardSummary(item)}</p><div className="card-actions"><button aria-label={`Ver detalhes de ${item.title}`} className="details-button" onClick={() => setSelectedItem(item)} type="button">Ver detalhes <CommandIcon name="arrow" size={22} /></button><FavoriteButton title={item.title} isFavorite={favoriteIds.has(item.id)} onToggle={() => toggleFavorite(item.id)} /></div></article>)}</div><CatalogPagination currentPage={pageWindow.currentPage} onPageChange={setCatalogPage} totalPages={pageWindow.totalPages} /></>
  }
  const switchPage = (nextPage: Page) => { setPage(nextPage); setCatalogPage(1); if (nextPage === 'explore') setSelectedCategory(null) }
  const selectCategory = (category: string | null) => { setSelectedCategory(category); setCatalogPage(1) }
  const canAdmin = hasAnyRole(authenticatedSession.roles ?? [], ['admin', 'manager', 'editor'])

  return <main className="app-shell">
    <aside className="command-rail"><a className="brand" href="/"><BrandMark /><span>Setup<br />Vencedor</span></a><nav aria-label="Principal" className="main-nav">{navItems.map(({ id, label, icon }) => <button aria-label={label} className={page === id ? 'active' : ''} key={id} onClick={() => switchPage(id)} type="button"><CommandIcon name={icon} /><span>{label}</span></button>)}{canAdmin ? <button aria-label="Administração" className={page === 'admin' ? 'active' : ''} onClick={() => switchPage('admin')} type="button"><CommandIcon name="admin" /><span>Administração</span></button> : null}</nav><div className="rail-footer"><span className="online-dot" /> Base privada ativa</div></aside>
    <section className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">WORKSPACE / BIBLIOTECA</p>
          <p className="topbar-title">A central de decisões técnicas da sua equipe.</p>
        </div>
        <div className="topbar-tools">
          <PwaInstallPrompt />
          <div className="identity"><span className="avatar">{authenticatedSession.user.email.slice(0, 1).toUpperCase()}</span><span>{authenticatedSession.user.email}</span></div>
        </div>
      </header>
      {page === 'explore' ? <section className="explore-page page-shell"><div className="command-hero"><div><p className="eyebrow">CENTRAL DE DESCOBERTA</p><h1>Escolha o próximo<br /><em>atalho técnico.</em></h1><p>Cada recurso vem com propósito: acelerar decisões, padronizar execuções e entregar resultado com clareza.</p></div><div className="hero-orbit"><span className="orbit-core">{catalog.length}<small>recursos</small></span><span className="orbit-label">Sistema<br />em evolução</span></div></div><label className="command-search"><Search size={20} /><span className="sr-only">Buscar no acervo</span><input aria-label="Buscar no acervo" value={query} onChange={(event) => { setQuery(event.target.value); setCatalogPage(1) }} placeholder="O que você quer construir hoje?" /><kbd>⌘ K</kbd></label><section className="discovery-section"><div className="section-heading"><div><p className="eyebrow">NAVEGAÇÃO</p><h2>O acervo, seus próximos 10 cliques de decisão.</h2></div><span>{results.length} {selectedCategory ? `itens em ${selectedCategory}` : 'itens disponíveis'}</span></div><div className="category-rail"><button className={selectedCategory === null ? 'active' : ''} onClick={() => selectCategory(null)} type="button"><BookOpen size={16} /> Tudo <b>{catalog.length}</b></button>{categories.map((category) => <button aria-pressed={selectedCategory === category} className={selectedCategory === category ? 'active' : ''} key={category} onClick={() => selectCategory(category)} type="button"><Sparkles size={16} /> {category} <b>{catalog.filter((item) => item.category === category).length}</b></button>)}</div></section>{catalogStatus ? <p role="status">{catalogStatus}</p> : null}<section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">ACERVO CURADO</p><h2>{selectedCategory ?? 'Explore o que está disponível'}</h2></div><span>Selecione o recurso e aplique em uma tarefa real.</span></div>{renderCatalog(results)}</section></section> : null}
      {page === 'assistant' ? <section className="inner-page page-shell assistant-page"><p className="eyebrow">ASSISTENTE DO ACERVO</p><h1>Encontre o próximo recurso.</h1><p>Use palavras do problema, tecnologia ou resultado esperado. A busca consulta títulos, temas e tags do seu próprio acervo.</p><AssistantSearch query={query} onQueryChange={(value) => { setQuery(value); setCatalogPage(1) }} results={results} renderResults={() => renderCatalog(results)} /></section> : null}
      {page === 'favorites' ? <section className="inner-page page-shell page-favorites"><p className="eyebrow">SEUS FAVORITOS</p><h1>Seu painel de atalhos.</h1><p>{favoriteItems.length ? 'Recursos salvos nesta conta.' : 'Salve recursos para montar sua própria trilha de trabalho.'}</p>{renderCatalog(favoriteItems)}</section> : null}
      {page === 'support' ? <section className="inner-page page-shell support-page"><p className="eyebrow">SUPORTE OPERACIONAL</p><h1>Uma dúvida não precisa travar sua entrega.</h1><p>Abra um chamado de acesso, dúvida, bug ou sugestão. A equipe responsável acompanha por status.</p><TicketForm onCreate={async (ticket) => { const supabase = getSupabaseClient(); if (!supabase) return; const { data: created, error } = await supabase.from('support_tickets').insert({ requester_id: authenticatedSession.user.id, subject: ticket.subject, type: ticket.type }).select('id').single(); if (error) throw error; if (created) { const { error: messageError } = await supabase.from('support_messages').insert({ ticket_id: created.id, author_id: authenticatedSession.user.id, body: ticket.body }); if (messageError) throw messageError } }} /></section> : null}
      {page === 'admin' && canAdmin ? <section className="inner-page page-shell admin-page"><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Controle com visão de sistema.</h1><div className="admin-grid"><article className="metric-card"><p>RECURSOS PUBLICADOS</p><strong>{catalog.length}</strong><span>Disponíveis para a equipe</span></article><article className="metric-card"><p>PAPÉIS ATIVOS</p><strong>{(authenticatedSession.roles ?? []).length || 1}</strong><span>{(authenticatedSession.roles ?? []).join(' / ') || 'membro'}</span></article><article className="metric-card"><p>FAVORITOS DA SESSÃO</p><strong>{favoriteIds.size}</strong><span>Atalhos pessoais salvos</span></article></div>{hasAnyRole(authenticatedSession.roles ?? [], ['admin']) ? <><InviteForm onCreated={() => setAccessRefreshKey((current) => current + 1)} /><PeopleDirectory currentUserId={authenticatedSession.user.id} refreshKey={accessRefreshKey} /></> : null}</section> : null}
    </section>
    {selectedItem ? <CatalogDetailPanel isFavorite={favoriteIds.has(selectedItem.id)} item={selectedItem} onClose={() => setSelectedItem(null)} onToggleFavorite={() => toggleFavorite(selectedItem.id)} /> : null}
  </main>
}
