import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt: () => Promise<void>
}

const isStandaloneDisplay = () => {
  const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayMode = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  return standalone || displayMode
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandaloneDisplay())
  const [message, setMessage] = useState('')
  const [guidanceOpen, setGuidanceOpen] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setMessage('')
      setGuidanceOpen(false)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setGuidanceOpen(false)
      setMessage('App instalado. Você já pode abrir pela tela inicial.')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) {
      setGuidanceOpen(true)
      return
    }
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } catch {
      setMessage('Não foi possível abrir a instalação agora. Tente novamente no Chrome.')
    }
  }

  if (installed) return <p className="pwa-status">{message || 'App já instalado no celular.'}</p>

  return <div className="pwa-install">
    <button className="pwa-install-btn" onClick={onInstall} type="button">Instalar app</button>
    {message ? <p className="pwa-status">{message}</p> : null}
    {guidanceOpen ? <section aria-label="Como instalar o aplicativo" className="pwa-guidance"><div><p><strong>No Android:</strong> abra o menu do Chrome e toque em “Instalar aplicativo”.</p><p><strong>No iPhone ou iPad:</strong> abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p></div><button aria-label="Fechar instruções" onClick={() => setGuidanceOpen(false)} type="button">Fechar</button></section> : null}
  </div>
}
