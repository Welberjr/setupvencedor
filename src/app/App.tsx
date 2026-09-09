import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, LogOut, Menu, Search, X } from 'lucide-react'
import { BrandMark } from '../features/brand/BrandMark'
import { CommandIcon, type CommandIconName } from '../features/brand/CommandIcon'
import { FavoriteButton } from '../features/catalog/FavoriteButton'
import { PublicSources } from '../features/catalog/PublicSources'
import { ResourceProfilePage } from '../features/catalog/ResourceProfilePage'
import { CatalogPagination } from '../features/catalog/CatalogPagination'
import { getPageWindow } from '../features/catalog/pagination'
import { useCatalogPageSize } from '../features/catalog/useCatalogPageSize'
import { createCardSummary } from '../features/catalog/catalog-narrative'
import { isRedundantCategoryLabel } from '../features/catalog/card-label'
import { dedupeCatalogItems } from '../features/catalog/catalog-deduplication'
import { createFallbackCatalogGuide, guideFromRow, type CatalogGuideRow } from '../features/catalog/catalog-guide'
import { readResourceSlug, resourcePath } from '../features/catalog/catalog-route'
import { pilotGuideForItem } from '../features/catalog/pilot-guide-data'
import { AssistantAdvisor, type AssistantResponse } from '../features/catalog/AssistantAdvisor'
import { sampleCatalog } from '../features/catalog/catalog-data'
import type { CatalogItem } from '../features/catalog/types'
import { PublicAccessPage } from '../features/auth/PublicAccessPage'
import { getSupabaseClient } from '../lib/supabase/client'
import { TicketForm, type TicketInput } from '../features/support/TicketForm'
import { SupportDesk, type SupportDeskTicket } from '../features/support/SupportDesk'
import type { TicketStatus } from '../features/support/status'
import { ActivateInvitePage } from '../features/auth/ActivateInvitePage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { McpAuthorizePage } from '../features/auth/McpAuthorizePage'
import { InviteForm } from '../features/admin/InviteForm'
import { PeopleDirectory } from '../features/admin/PeopleDirectory'
import { hasAnyRole, type Role } from '../lib/roles'
import { PwaInstallPrompt } from '../features/pwa/PwaInstallPrompt'
import { HanddrawnLabBadge } from '../features/handdrawn/HanddrawnLabBadge'
import type { VisualMode } from '../features/handdrawn/visual-mode'
import { ExploreHero } from '../features/handdrawn/ExploreHero'
import { WorkspaceAreaHero } from '../features/handdrawn/WorkspaceAreaHero'
import { WorkspaceNamePrompt } from '../features/profile/WorkspaceNamePrompt'
import { CommunityWelcomePrompt } from '../features/profile/CommunityWelcomePrompt'
import { SetupAgentPage } from '../features/mcp/SetupAgentPage'
import { authCallbackErrorMessage } from '../features/auth/auth-callback-error'

type Session = { user: { id: string; email: string; displayName?: string }; roles?: Role[] } | null
type Page = 'explore' | 'assistant' | 'setup-agent' | 'favorites' | 'support' | 'admin'

type CatalogRow = {
  id: string; slug: string; title: string; item_type: string; summary: string; own_content: string; official_url: string; instructions: string
  status: CatalogItem['status']; visibility: CatalogItem['visibility']; categories: { name: string } | null
  catalog_item_topics: Array<{ topics: { name: string } | null }>; catalog_item_tags: Array<{ tags: { name: string } | null }>; catalog_item_sources: Array<{ source_url: string }>; catalog_item_guides?: CatalogGuideRow[]
}

type SupportTicketRow = {
  id: string
  subject: string
  type: string
  status: TicketStatus
  created_at: string
  last_activity_at: string
}

function toCatalogItem(row: CatalogRow): CatalogItem {
  const guide = row.catalog_item_guides?.[0] ? guideFromRow(row.catalog_item_guides[0]) : pilotGuideForItem(row.slug, row.id)
  return { id: row.id, slug: row.slug, title: row.title, type: row.item_type, summary: row.summary, ownContent: row.own_content, officialUrl: row.official_url, sourceUrls: row.catalog_item_sources.map((source) => source.source_url), instructions: row.instructions, status: row.status, visibility: row.visibility, category: row.categories?.name ?? 'Acervo', topics: row.catalog_item_topics.map((item) => item.topics?.name).filter((name): name is string => Boolean(name)), tags: row.catalog_item_tags.map((item) => item.tags?.name).filter((name): name is string => Boolean(name)), guide }
}

const navItems: Array<{ id: Page; label: string; icon: CommandIconName }> = [
  { id: 'explore', label: 'Explorar', icon: 'explore' }, { id: 'assistant', label: 'Assistente', icon: 'assistant' }, { id: 'setup-agent', label: 'Setup Agent', icon: 'agent' }, { id: 'favorites', label: 'Favoritos', icon: 'favorites' }, { id: 'support', label: 'Suporte', icon: 'support' },
]
export function App({ session = null, visualMode = 'command-center', showLabBadge = false }: { session?: Session; visualMode?: VisualMode; showLabBadge?: boolean }) {
  if (window.location.pathname === '/ativar') return <ActivateInvitePage visualMode={visualMode} />
  if (window.location.pathname === '/redefinir-senha') return <ResetPasswordPage visualMode={visualMode} />
  if (session && window.location.pathname === '/mcp/autorizar') return <McpAuthorizePage />
  if (!session && window.location.pathname === '/boas-vindas') {
    const callbackError = authCallbackErrorMessage(window.location.hash)
    return <main className={`app-shell auth-shell confirmation-shell ${visualMode}`}><section className="public-confirmation"><p className="eyebrow">SETUP VENCEDOR</p><h1>{callbackError ? 'Vamos resolver seu acesso.' : 'Seu acesso está confirmado.'}</h1><p>{callbackError ?? 'Agora você pode entrar no acervo e, se quiser acompanhar novidades e tirar dúvidas, participar da nossa comunidade.'}</p>{callbackError ? <a className="public-confirmation-login" href="/">Voltar para o acesso</a> : <><a href="https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr" rel="noreferrer" target="_blank">Entrar na comunidade do WhatsApp ↗</a><a className="public-confirmation-login" href="/">Entrar no acervo</a></>}</section></main>
  }
  if (!session) return <main className={`app-shell auth-shell public-access-shell ${visualMode}`}><PublicAccessPage onLogin={async (email, password, captchaToken) => { const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured'); const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } }); if (error) throw error }} onSignUp={async ({ fullName, email, phone, password, captchaToken, termsAccepted, termsVersion }) => { const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured'); const { error } = await supabase.auth.signUp({ email, password, options: { captchaToken, data: { full_name: fullName, phone: phone || undefined, terms_accepted: termsAccepted, terms_version: termsVersion }, emailRedirectTo: `${window.location.origin}/boas-vindas` } }); if (error) throw error }} onForgotPassword={async (email, captchaToken) => { const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured'); const { error } = await supabase.auth.resetPasswordForEmail(email, { captchaToken, redirectTo: `${window.location.origin}/redefinir-senha` }); if (error) throw error }} /></main>
  const authenticatedSession = session

  const [exploreQuery, setExploreQuery] = useState('')
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null)
  const [copiedAssistantPrompt, setCopiedAssistantPrompt] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('explore')
  const [catalog, setCatalog] = useState<CatalogItem[]>(sampleCatalog)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [catalogStatus, setCatalogStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [resourceSlug, setResourceSlug] = useState(() => readResourceSlug(window.location.pathname))
  const [catalogPage, setCatalogPage] = useState(1)
  const [accessRefreshKey, setAccessRefreshKey] = useState(0)
  const [displayName, setDisplayName] = useState(authenticatedSession.user.displayName?.trim() ?? '')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [accountStatus, setAccountStatus] = useState('')
  const [isCommunityWelcomeOpen, setIsCommunityWelcomeOpen] = useState(false)
  const [supportTickets, setSupportTickets] = useState<SupportDeskTicket[]>([])
  const catalogPageSize = useCatalogPageSize()

  useEffect(() => {
    const handlePopState = () => setResourceSlug(readResourceSlug(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient(); if (!supabase) return
    const catalogClient = supabase
    let active = true
    async function loadCatalog() {
      const baseCatalogSelect = 'id,slug,title,item_type,summary,own_content,official_url,instructions,status,visibility,categories(name),catalog_item_topics(topics(name)),catalog_item_tags(tags(name)),catalog_item_sources(source_url)'
      const [{ data: guideRows, error: guideError }, { data: favoriteRows, error: favoritesError }] = await Promise.all([
        catalogClient.from('catalog_items').select(`${baseCatalogSelect},catalog_item_guides(*)`).eq('status', 'published').order('published_at', { ascending: false }),
        catalogClient.from('favorites').select('catalog_item_id').eq('user_id', authenticatedSession.user.id),
      ])
      let itemRows: unknown = guideRows
      let itemsError = guideError
      if (guideError) {
        const fallback = await catalogClient.from('catalog_items').select(baseCatalogSelect).eq('status', 'published').order('published_at', { ascending: false })
        itemRows = fallback.data
        itemsError = fallback.error
      }
      if (!active) return
      if (itemsError || favoritesError) { setCatalogStatus('Não foi possível sincronizar o acervo agora. Tente novamente em instantes.'); return }
      setCatalog(dedupeCatalogItems((itemRows as unknown as CatalogRow[]).map(toCatalogItem))); setFavoriteIds(new Set((favoriteRows ?? []).map((row) => row.catalog_item_id)))
    }
    void loadCatalog(); return () => { active = false }
  }, [authenticatedSession.user.id])

  async function loadSupportTickets() {
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { data, error } = await supabase.from('support_tickets').select('id,subject,type,status,created_at,last_activity_at').order('last_activity_at', { ascending: false })
    if (error) return
    setSupportTickets((data as SupportTicketRow[]).map((ticket) => ({ id: ticket.id, subject: ticket.subject, type: ticket.type, status: ticket.status, createdAt: ticket.created_at, lastActivityAt: ticket.last_activity_at })))
  }

  useEffect(() => { void loadSupportTickets() }, [authenticatedSession.user.id])

  const categories = useMemo(() => [...new Set(catalog.map((item) => item.category))].sort((first, second) => first.localeCompare(second)), [catalog])
  const results = useMemo(() => {
    const normalized = exploreQuery.toLowerCase().trim()
    return catalog.filter((item) => (!selectedCategory || item.category === selectedCategory) && (!normalized || `${item.title} ${item.summary} ${item.ownContent} ${item.tags.join(' ')} ${item.topics.join(' ')}`.toLowerCase().includes(normalized)))
  }, [catalog, exploreQuery, selectedCategory])
  const favoriteItems = useMemo(() => catalog.filter((item) => favoriteIds.has(item.id)), [catalog, favoriteIds])
  const assistantItems = useMemo(() => assistantResponse?.resources.map((resource) => catalog.find((item) => item.id === resource.id)).filter((item): item is CatalogItem => Boolean(item)) ?? [], [assistantResponse, catalog])
  const resourceItem = useMemo(() => resourceSlug ? catalog.find((item) => item.slug === resourceSlug) ?? null : null, [catalog, resourceSlug])
  const resourceGuide = useMemo(() => resourceItem ? resourceItem.guide ?? createFallbackCatalogGuide(resourceItem) : null, [resourceItem])

  async function toggleFavorite(itemId: string) {
    const supabase = getSupabaseClient(); if (!supabase) return
    const wasFavorite = favoriteIds.has(itemId)
    setFavoriteIds((current) => { const next = new Set(current); wasFavorite ? next.delete(itemId) : next.add(itemId); return next })
    const request = wasFavorite ? supabase.from('favorites').delete().eq('user_id', authenticatedSession.user.id).eq('catalog_item_id', itemId) : supabase.from('favorites').insert({ user_id: authenticatedSession.user.id, catalog_item_id: itemId })
    const { error } = await request
    if (error) { setFavoriteIds((current) => { const next = new Set(current); wasFavorite ? next.add(itemId) : next.delete(itemId); return next }); setCatalogStatus('Não foi possível atualizar seus favoritos. Tente novamente.') }
  }

  function openItem(item: CatalogItem) {
    window.history.pushState({}, '', resourcePath(item.slug))
    setResourceSlug(item.slug)
  }

  function closeResourceProfile() {
    window.history.pushState({}, '', '/')
    setResourceSlug(null)
  }

  async function copyAssistantPrompt(id: string, prompt: string) {
    await navigator.clipboard?.writeText(prompt)
    setCopiedAssistantPrompt(id)
  }

  const renderCatalog = (items: CatalogItem[], options?: { gridClassName?: string; pageSize?: number }) => {
    const pageWindow = getPageWindow(items, catalogPage, options?.pageSize ?? catalogPageSize)
    return <><div className={`catalog-grid${options?.gridClassName ? ` ${options.gridClassName}` : ''}`}>{pageWindow.items.map((item) => <article className={`catalog-card type-${item.type.toLowerCase().replaceAll(' ', '-')}`} key={item.id}><div className="card-topline"><p className="eyebrow">{item.type}</p>{!isRedundantCategoryLabel(item.type, item.category) && <span>{item.category}</span>}</div><h2>{item.title}</h2><p>{createCardSummary(item)}</p><div className="card-actions"><button aria-label={`Ver detalhes de ${item.title}`} className="details-button" onClick={() => openItem(item)} type="button">Ver detalhes <CommandIcon name="arrow" size={22} /></button><FavoriteButton title={item.title} isFavorite={favoriteIds.has(item.id)} onToggle={() => toggleFavorite(item.id)} /></div></article>)}</div><CatalogPagination currentPage={pageWindow.currentPage} onPageChange={setCatalogPage} totalPages={pageWindow.totalPages} /></>
  }
  const switchPage = (nextPage: Page) => {
    setPage(nextPage)
    setCatalogPage(1)
    setIsCategoryMenuOpen(false)
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
  const selectCategory = (category: string | null) => { setSelectedCategory(category); setPage('explore'); setCatalogPage(1); setIsCategoryMenuOpen(false); setIsMobileMenuOpen(false) }
  const canAdmin = hasAnyRole(authenticatedSession.roles ?? [], ['admin', 'manager', 'editor'])
  const accountName = displayName || 'Seu perfil'

  async function saveDisplayName(nextDisplayName: string) {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('supabase_not_configured')
    const { error } = await supabase.from('profiles').update({ display_name: nextDisplayName }).eq('id', authenticatedSession.user.id)
    if (error) throw error
    setDisplayName(nextDisplayName)
    setIsCommunityWelcomeOpen(true)
  }

  async function signOut() {
    const supabase = getSupabaseClient()
    if (!supabase) { setAccountStatus('Não foi possível encerrar a sessão agora.'); return }
    const { error } = await supabase.auth.signOut()
    if (error) setAccountStatus('Não foi possível encerrar a sessão agora.')
  }

  async function createSupportTicket(ticket: TicketInput) {
    const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured')
    const { data: created, error } = await supabase.from('support_tickets').insert({ requester_id: authenticatedSession.user.id, subject: ticket.subject, type: ticket.type }).select('id').single()
    if (error || !created) throw error ?? new Error('ticket_not_created')
    const { error: messageError } = await supabase.from('support_messages').insert({ ticket_id: created.id, author_id: authenticatedSession.user.id, body: ticket.body, body_rich: ticket.bodyRich })
    if (messageError) throw messageError
    if (ticket.attachment) {
      const extension = ticket.attachment.type === 'image/png' ? 'png' : ticket.attachment.type === 'image/webp' ? 'webp' : 'jpg'
      const objectPath = `${authenticatedSession.user.id}/${created.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('support-attachments').upload(objectPath, ticket.attachment, { contentType: ticket.attachment.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: attachmentError } = await supabase.from('support_attachments').insert({ ticket_id: created.id, uploaded_by: authenticatedSession.user.id, storage_path: objectPath, file_name: ticket.attachment.name, mime_type: ticket.attachment.type, byte_size: ticket.attachment.size })
      if (attachmentError) { await supabase.storage.from('support-attachments').remove([objectPath]); throw attachmentError }
    }
    await loadSupportTickets()
  }

  async function changeSupportStatus(ticketId: string, status: TicketStatus) {
    const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured')
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId)
    if (error) throw error
    await loadSupportTickets()
  }

  async function addSupportInternalNote(ticketId: string, body: string) {
    const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured')
    const { error } = await supabase.from('support_internal_notes').insert({ ticket_id: ticketId, author_id: authenticatedSession.user.id, body })
    if (error) throw error
  }

  async function addSupportReply(ticketId: string, body: string) {
    const supabase = getSupabaseClient(); if (!supabase) throw new Error('supabase_not_configured')
    const { error } = await supabase.from('support_messages').insert({ ticket_id: ticketId, author_id: authenticatedSession.user.id, body, body_rich: body })
    if (error) throw error
    await loadSupportTickets()
  }

  return <main className={`app-shell ${visualMode}`}>
    <aside className={`command-rail${isMobileMenuOpen ? ' mobile-menu-open' : ''}`}>
      <a className="brand" href="/"><BrandMark /><span>Setup<br />Vencedor</span></a>
      <button aria-controls="mobile-primary-menu" aria-expanded={isMobileMenuOpen} aria-label={isMobileMenuOpen ? 'Fechar menu principal' : 'Abrir menu principal'} className="mobile-menu-toggle" onClick={() => { setIsCategoryMenuOpen(false); setIsMobileMenuOpen((open) => !open) }} type="button">{isMobileMenuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}<span>{isMobileMenuOpen ? 'Fechar' : 'Menu'}</span></button>
      <nav aria-label="Principal" className="main-nav" id="mobile-primary-menu">
        {navItems.map(({ id, label, icon }) => id === 'explore' ? <div className="explore-nav-group" key={id}>
          <button aria-controls="explore-category-menu" aria-expanded={page === 'explore' && isCategoryMenuOpen} aria-label="Explorar e filtrar categorias" className={page === id ? 'active' : ''} onClick={() => { if (page !== 'explore') switchPage('explore'); setIsCategoryMenuOpen((open) => page === 'explore' ? !open : true) }} type="button"><CommandIcon name={icon} /><span>Explorar</span><i aria-hidden="true" className={page === 'explore' && isCategoryMenuOpen ? 'filter-chevron open' : 'filter-chevron'} /></button>
          {page === 'explore' && isCategoryMenuOpen ? <>
            <div aria-label="Filtrar acervo" className="explore-submenu" id="explore-category-menu">
              <button aria-pressed={selectedCategory === null} className={selectedCategory === null ? 'selected' : ''} onClick={() => selectCategory(null)} type="button">Todos <b>{catalog.length}</b></button>
              {categories.map((category) => <button aria-pressed={selectedCategory === category} className={selectedCategory === category ? 'selected' : ''} key={category} onClick={() => selectCategory(category)} type="button">{category} <b>{catalog.filter((item) => item.category === category).length}</b></button>)}
            </div>
          </> : null}
        </div> : <button aria-label={label} className={page === id ? 'active' : ''} key={id} onClick={() => switchPage(id)} type="button"><CommandIcon name={icon} /><span>{label}</span></button>)}
        {canAdmin ? <button aria-label="Administração" className={page === 'admin' ? 'active' : ''} onClick={() => switchPage('admin')} type="button"><CommandIcon name="admin" /><span>Administração</span></button> : null}
      </nav>
      <div aria-label="Conta da área de trabalho" className="workspace-account">
        {isAccountMenuOpen ? <div aria-label="Menu da conta" className="account-menu" id="workspace-account-menu" role="menu"><p>Conta conectada</p><strong>{displayName || 'Seu perfil'}</strong><button onClick={() => void signOut()} role="menuitem" type="button"><LogOut aria-hidden="true" size={16} />Sair</button>{accountStatus ? <small role="status">{accountStatus}</small> : null}</div> : null}
        <button aria-controls="workspace-account-menu" aria-expanded={isAccountMenuOpen} aria-haspopup="menu" aria-label="Abrir menu da conta" className="identity account-trigger" onClick={() => { setAccountStatus(''); setIsAccountMenuOpen((open) => !open) }} title={displayName ? authenticatedSession.user.email : undefined} type="button"><span className="avatar">{accountName.slice(0, 1).toUpperCase()}</span><span>{accountName}</span><ChevronDown aria-hidden="true" className={isAccountMenuOpen ? 'account-chevron open' : 'account-chevron'} size={15} /></button>
        <a aria-label="Entrar na Comunidade WhatsApp" className="community-rail-link" href="https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr" rel="noreferrer" target="_blank"><span className="community-rail-mark" aria-hidden="true">◔</span> Comunidade WhatsApp <span aria-hidden="true">↗</span></a>
        <PwaInstallPrompt />
      </div>
    </aside>
    <section className="workspace">
      {visualMode === 'handdrawn-lab' && showLabBadge ? <HanddrawnLabBadge /> : null}
      {visualMode === 'handdrawn-lab' && !displayName ? <WorkspaceNamePrompt onSave={saveDisplayName} /> : null}
      {visualMode === 'handdrawn-lab' && isCommunityWelcomeOpen ? <CommunityWelcomePrompt onClose={() => setIsCommunityWelcomeOpen(false)} /> : null}
      {resourceSlug ? resourceItem && resourceGuide ? <ResourceProfilePage guide={resourceGuide} isFavorite={favoriteIds.has(resourceItem.id)} item={resourceItem} onBack={closeResourceProfile} onToggleFavorite={() => toggleFavorite(resourceItem.id)} /> : <section className="resource-profile page-shell"><p role="status">Carregando a ficha do recurso…</p></section> : <>
      {page === 'explore' ? <section className="explore-page page-shell">
        {visualMode === 'handdrawn-lab' ? <ExploreHero totalItems={catalog.length} /> : <div className="page-heading command-hero">
          <h1 className="page-title">Escolha o próximo <em>atalho técnico.</em></h1>
          <p>Cada recurso vem com propósito: acelerar decisões, padronizar execuções e entregar resultado com clareza.</p>
        </div>}
        <label className="command-search explore-search"><Search size={20} /><span className="sr-only">Buscar no acervo</span><input aria-label="Buscar no acervo" value={exploreQuery} onChange={(event) => { setExploreQuery(event.target.value); setCatalogPage(1) }} placeholder="Pesquisar no acervo" /></label>
        {catalogStatus ? <p role="status">{catalogStatus}</p> : null}
        <section className="catalog-section"><div className="section-heading"><h2>{selectedCategory ?? 'Explore o que está disponível'}</h2><span>{results.length} {selectedCategory ? `itens em ${selectedCategory}` : 'itens disponíveis'} · Selecione um recurso e aplique em uma tarefa real.</span></div>{renderCatalog(results)}</section>
      </section> : null}
      {page === 'assistant' ? <section className="inner-page page-shell assistant-page">
        {visualMode === 'handdrawn-lab' ? <WorkspaceAreaHero area="assistant" description="Explique com suas palavras ou por voz. Você receberá uma trilha com os recursos certos para começar." /> : <div className="page-heading"><h1 className="page-title">O que você precisa construir?</h1><p>Explique com suas palavras ou por voz. Você receberá uma trilha com os recursos certos para começar.</p></div>}
        <AssistantAdvisor onResult={(result) => { setAssistantResponse(result); setCopiedAssistantPrompt(null); setCatalogPage(1) }} />
        {assistantResponse ? <section className="assistant-answer">
          <div className="assistant-paper">
            <div className="assistant-paper-intro">
              <p className="assistant-mode">TRILHA PARA {assistantResponse.client.label.toUpperCase()}</p>
              <h2>Sua rota desenhada.</h2>
              <p className="assistant-route-summary">{assistantResponse.summary}</p>
              <p className="assistant-paper-note">Uma explicação curta para você escolher, copiar e testar sem se perder.</p>
            </div>
            <ol aria-label="Como seguir esta rota" className="assistant-paper-moves">
              <li><b>1</b><span>Escolha</span><small>Comece pelo recurso que conversa direto com o seu objetivo.</small></li>
              <li><b>2</b><span>Copie</span><small>Use o prompt pronto para pedir a primeira execução ao seu agente.</small></li>
              <li><b>3</b><span>Teste</span><small>Valide em uma tarefa pequena antes de levar para o projeto principal.</small></li>
            </ol>
          </div>
          {assistantResponse.transcript ? <p className="assistant-transcript">Transcrição: “{assistantResponse.transcript}”</p> : null}
          <ol className={`assistant-reasons${assistantResponse.recommendations.length % 2 ? ' assistant-reasons-odd' : ''}`}>
            {assistantResponse.recommendations.map((recommendation, index) => {
              const resource = assistantResponse.resources.find((item) => item.id === recommendation.id)
              const title = resource?.title ?? 'Recurso recomendado'
              return <li key={recommendation.id}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div>
                  <strong>{title}</strong>
                  <p>{recommendation.why}</p>
                  <small><em>Como começar</em>{recommendation.installation}</small>
                  <small><em>Depois disso</em>{recommendation.nextStep}</small>
                  <button aria-label={`Copiar prompt de ${title} para ${assistantResponse.client.label}`} className="assistant-prompt-copy" onClick={() => void copyAssistantPrompt(recommendation.id, recommendation.prompt)} type="button">{copiedAssistantPrompt === recommendation.id ? 'Prompt copiado' : 'Copiar prompt pronto'}</button>
                </div>
              </li>
            })}
          </ol>
          {assistantItems.length ? renderCatalog(assistantItems, { gridClassName: 'assistant-catalog-grid', pageSize: 10 }) : <p className="assistant-empty">Nenhum recurso do acervo corresponde a essa necessidade ainda.</p>}
        </section> : null}
      </section> : null}
      {page === 'setup-agent' ? <SetupAgentPage /> : null}
      {page === 'favorites' ? <section className="inner-page page-shell page-favorites">
        {visualMode === 'handdrawn-lab' ? <WorkspaceAreaHero area="favorites" description={favoriteItems.length ? 'Recursos salvos para você voltar ao que importa.' : 'Salve recursos para montar sua própria trilha de trabalho.'} /> : <div className="page-heading"><h1 className="page-title">Seus atalhos favoritos.</h1><p>{favoriteItems.length ? 'Recursos salvos para você voltar ao que importa.' : 'Salve recursos para montar sua própria trilha de trabalho.'}</p></div>}
  {favoriteItems.length ? renderCatalog(favoriteItems) : <div className="favorites-empty-zone"><p className="empty-state">Ainda não há recursos salvos. Explore o acervo e favorite o que fizer sentido para você.</p></div>}
      </section> : null}
      {page === 'support' ? <section className="inner-page page-shell support-page">
        {visualMode === 'handdrawn-lab' ? <WorkspaceAreaHero area="support" description="Abra um chamado de acesso, dúvida, bug ou sugestão. A equipe responsável acompanha por status." /> : <div className="page-heading"><h1 className="page-title">Como podemos ajudar?</h1><p>Abra um chamado de acesso, dúvida, bug ou sugestão. A equipe responsável acompanha por status.</p></div>}
        <SupportDesk currentUserId={authenticatedSession.user.id} onAddInternalNote={addSupportInternalNote} onChangeStatus={changeSupportStatus} onReply={addSupportReply} roles={authenticatedSession.roles ?? ['member']} tickets={supportTickets} />
        <TicketForm onCreate={createSupportTicket} />
      </section> : null}
      {page === 'admin' && canAdmin ? <section className="inner-page page-shell admin-page">
        {visualMode === 'handdrawn-lab' ? <WorkspaceAreaHero area="admin" description="Gerencie acessos, convites e os recursos disponíveis para toda a equipe." /> : <div className="page-heading"><h1 className="page-title">Controle da sua biblioteca.</h1><p>Gerencie acessos, convites e os recursos disponíveis para toda a equipe.</p></div>}
        <div className="admin-grid"><article className="metric-card"><p>RECURSOS PUBLICADOS</p><strong>{catalog.length}</strong><span>Disponíveis para a equipe</span></article><article className="metric-card"><p>PAPÉIS ATIVOS</p><strong>{(authenticatedSession.roles ?? []).length || 1}</strong><span>{(authenticatedSession.roles ?? []).join(' / ') || 'membro'}</span></article><article className="metric-card"><p>FAVORITOS DA SESSÃO</p><strong>{favoriteIds.size}</strong><span>Atalhos pessoais salvos</span></article></div>{hasAnyRole(authenticatedSession.roles ?? [], ['admin']) ? <><InviteForm onCreated={() => setAccessRefreshKey((current) => current + 1)} /><PeopleDirectory currentUserId={authenticatedSession.user.id} refreshKey={accessRefreshKey} /></> : null}
      </section> : null}
      </>}
    </section>
  </main>
}
