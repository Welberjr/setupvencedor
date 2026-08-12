import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { getSupabaseClient } from './lib/supabase/client'
import type { Role } from './lib/roles'
import './styles.css'

function Bootstrap() {
  const [session, setSession] = useState<{ user: { id: string; email: string }; roles: Role[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) { setIsLoading(false); return }
    const hydrate = async (next: typeof supabase.auth extends never ? never : Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!next) { setSession(null); return }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', next.user.id)
      setSession({ user: { id: next.user.id, email: next.user.email ?? '' }, roles: (roles ?? []).map((row) => row.role as Role) })
    }
    supabase.auth.getSession().then(async ({ data }) => { await hydrate(data.session); setIsLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => hydrate(next))
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
