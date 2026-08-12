import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { getSupabaseClient } from './lib/supabase/client'
import './styles.css'

function Bootstrap() {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) { setIsLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session ? { user: { id: data.session.user.id, email: data.session.user.email ?? '' } } : null); setIsLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next ? { user: { id: next.user.id, email: next.user.email ?? '' } } : null))
    return () => listener.subscription.unsubscribe()
  }, [])
  if (isLoading) return <main className="app-shell"><p className="eyebrow">CARREGANDO ACESSO SEGURO</p></main>
  return <App session={session} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
