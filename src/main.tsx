import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import type { Session as SupabaseSession } from '@supabase/supabase-js'
import { getSupabaseClient } from './lib/supabase/client'
import type { Role } from './lib/roles'
import './styles.css'

function Bootstrap() {
  const [session, setSession] = useState<{ user: { id: string; email: string }; roles: Role[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) { setIsLoading(false); return }
    let active = true
    const finishLoading = () => { if (active) setIsLoading(false) }
    const hydrate = async (next: SupabaseSession | null) => {
      if (!next) { setSession(null); return }
      const { data: roles, error } = await supabase.from('user_roles').select('role').eq('user_id', next.user.id)
      if (error) throw error
      setSession({ user: { id: next.user.id, email: next.user.email ?? '' }, roles: (roles ?? []).map((row) => row.role as Role) })
    }
    const loadingTimeout = window.setTimeout(finishLoading, 300)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => {
        void hydrate(next).catch(() => setSession(null)).finally(() => {
          window.clearTimeout(loadingTimeout)
          finishLoading()
        })
      }, 0)
    })
    return () => { active = false; window.clearTimeout(loadingTimeout); listener.subscription.unsubscribe() }
  }, [])
  if (isLoading) return <main className="app-shell"><p className="eyebrow">CARREGANDO ACESSO SEGURO</p></main>
  return <App session={session} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
