import { useEffect, useRef } from 'react'

type TurnstileAction = 'signup' | 'login' | 'recovery'

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    action: TurnstileAction
    callback: (token: string) => void
    'error-callback': () => void
    'expired-callback': () => void
    sitekey: string
    theme: 'light'
  }) => string
  remove?: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type TurnstileChallengeProps = {
  action: TurnstileAction
  onTokenChange: (token: string) => void
}

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()
let turnstileLoader: Promise<TurnstileApi | null> | undefined

function loadTurnstile(): Promise<TurnstileApi | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (turnstileLoader) return turnstileLoader

  turnstileLoader = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-setup-vencedor-turnstile]')
    const script = existing ?? document.createElement('script')
    const complete = () => resolve(window.turnstile ?? null)
    script.addEventListener('load', complete, { once: true })
    script.addEventListener('error', () => resolve(null), { once: true })
    if (!existing) {
      script.async = true
      script.defer = true
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.dataset.setupVencedorTurnstile = 'true'
      document.head.append(script)
    }
  })

  return turnstileLoader
}

export function TurnstileChallenge({ action, onTokenChange }: TurnstileChallengeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)
  const onTokenChangeRef = useRef(onTokenChange)
  onTokenChangeRef.current = onTokenChange

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false
    onTokenChangeRef.current('')

    void loadTurnstile().then((turnstile) => {
      if (cancelled || !turnstile || !containerRef.current) return
      widgetIdRef.current = turnstile.render(containerRef.current, {
        action,
        callback: (token) => onTokenChangeRef.current(token),
        'error-callback': () => onTokenChangeRef.current(''),
        'expired-callback': () => onTokenChangeRef.current(''),
        sitekey: siteKey,
        theme: 'light',
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current) window.turnstile?.remove?.(widgetIdRef.current)
      widgetIdRef.current = undefined
    }
  }, [action])

  if (!siteKey) return null

  return <div aria-label="Verificação de segurança" className="turnstile-challenge" ref={containerRef} role="group" />
}
