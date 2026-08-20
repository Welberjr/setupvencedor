import { useEffect, useState } from 'react'
import { workerUrl } from '../../lib/api/worker'
import { getSupabaseClient } from '../../lib/supabase/client'

type ActivityAnalyticsData = {
  periodDays: 7 | 30 | 90
  eventTotals: Array<{ eventType: string; count: number }>
  topSearches: Array<{ searchTerm: string; count: number }>
  topResources: Array<{ title: string; count: number }>
}

const eventLabels: Record<string, string> = {
  session_started: 'entradas na plataforma',
  catalog_search: 'buscas no acervo',
  resource_opened: 'aberturas de recursos',
  resource_source_opened: 'fontes oficiais abertas',
  favorite_added: 'favoritos adicionados',
  favorite_removed: 'favoritos removidos',
  assistant_requested: 'consultas ao Assistente',
}

async function authorizedFetch(path: string): Promise<Response> {
  const client = getSupabaseClient()
  const { data: { session } } = await client?.auth.getSession() ?? { data: { session: null } }
  if (!session) throw new Error('session_expired')
  return fetch(workerUrl(path), { headers: { authorization: `Bearer ${session.access_token}` } })
}

export function ActivityAnalytics() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [data, setData] = useState<ActivityAnalyticsData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void authorizedFetch(`/v1/admin/analytics?days=${days}`).then(async (response) => {
      if (!response.ok) throw new Error('analytics_not_available')
      return response.json() as Promise<ActivityAnalyticsData>
    }).then((next) => {
      if (active) { setData(next); setError('') }
    }).catch(() => {
      if (active) setError('Não foi possível carregar os dados de uso agora.')
    })
    return () => { active = false }
  }, [days])

  return <section aria-labelledby="activity-analytics-title" className="activity-analytics">
    <div className="activity-analytics-heading"><div><p className="eyebrow">USO DA PLATAFORMA</p><h2 id="activity-analytics-title">O que a equipe está encontrando.</h2></div><label>Período<select aria-label="Período das métricas" onChange={(event) => setDays(Number(event.target.value) as 7 | 30 | 90)} value={days}><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select></label></div>
    {error ? <p role="status">{error}</p> : null}
    {!data && !error ? <p>Carregando dados de uso…</p> : null}
    {data ? <div className="activity-analytics-grid">
      <article><h3>Ações da equipe</h3><ul>{data.eventTotals.length ? data.eventTotals.map((entry) => <li key={entry.eventType}><span>{entry.count} {eventLabels[entry.eventType] ?? entry.eventType}</span></li>) : <li>Nenhuma ação registrada neste período.</li>}</ul></article>
      <article><h3>Termos mais buscados</h3><ol>{data.topSearches.length ? data.topSearches.map((entry) => <li key={entry.searchTerm}><span>{entry.searchTerm}</span><b>{entry.count}</b></li>) : <li>As próximas buscas aparecerão aqui.</li>}</ol></article>
      <article><h3>Recursos mais abertos</h3><ol>{data.topResources.length ? data.topResources.map((entry) => <li key={entry.title}><span>{entry.title}</span><b>{entry.count}</b></li>) : <li>As próximas visualizações aparecerão aqui.</li>}</ol></article>
    </div> : null}
  </section>
}
