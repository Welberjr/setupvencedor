import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import type { Session as SupabaseSession } from '@supabase/supabase-js'
import { getSupabaseClient } from './lib/supabase/client'
import type { Role } from './lib/roles'
import { readVisualMode } from './features/handdrawn/visual-mode'
import './styles.css'
import './styles/handdrawn-tokens.css'
import './styles/handdrawn-shell.css'
import './styles/handdrawn-explore.css'
import './styles/handdrawn-pages.css'
import './styles/handdrawn-responsive.css'

const SW_UPDATE_INTERVAL_MS = 5 * 60 * 1000
const visualMode = readVisualMode(import.meta.env.VITE_VISUAL_MODE)
const showLabBadge = import.meta.env.VITE_LAB_BADGE === 'true'

function usePwaUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let hasReloaded = false
    let intervalId: number | undefined

    const onControllerChange = () => {
      if (hasReloaded) return
      hasReloaded = true
      window.location.reload()
    }

    const applyUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }

      const worker = registration.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    }

    void (async () => {
      try {
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

        const registration = await navigator.serviceWorker.register('/sw.js')

        applyUpdate(registration)

        intervalId = window.setInterval(() => {
          void registration.update()
        }, SW_UPDATE_INTERVAL_MS)

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch {
        // Se o service worker não puder ser registrado, o app continua normal no modo web.
      }
    })()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])
}

function Bootstrap() {
  usePwaUpdate()
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
  if (isLoading) return null
  return <App session={session} showLabBadge={showLabBadge} visualMode={visualMode} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
