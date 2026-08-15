import { useState } from 'react'
import { getSupabaseClient } from '../../lib/supabase/client'
import { workerUrl } from '../../lib/api/worker'

export function McpAuthorizePage() {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const request = new URLSearchParams(window.location.search)
  const clientId = request.get('client_id') ?? ''
  const redirectUri = request.get('redirect_uri') ?? ''
  const codeChallenge = request.get('code_challenge') ?? ''
  const state = request.get('state') ?? undefined

  async function decide(approved: boolean) {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } }
    if (!session) { setMessage('Entre na sua conta do Setup Vencedor para continuar a autorização.'); return }
    setPending(true); setMessage('')
    try {
      const response = await fetch(workerUrl('/api/oauth/consent'), { method: 'POST', headers: { authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri, code_challenge: codeChallenge, state, approved }) })
      const payload = await response.json() as { redirect_uri?: string; error?: string }
      if (!response.ok || !payload.redirect_uri) throw new Error(payload.error ?? 'authorization_failed')
      window.location.assign(payload.redirect_uri)
    } catch { setMessage('Não foi possível concluir a autorização. Volte ao aplicativo que iniciou a conexão e tente novamente.') } finally { setPending(false) }
  }

  return <main className="app-shell auth-shell handdrawn-lab"><section className="public-confirmation mcp-authorize" aria-labelledby="mcp-authorize-title"><p className="eyebrow">CONEXÃO MCP SEGURA</p><h1 id="mcp-authorize-title">Autorizar acesso ao acervo?</h1><p>O aplicativo conectado poderá pesquisar e consultar apenas recursos publicados para a sua equipe. Ele não poderá alterar itens, pessoas ou configurações.</p><p className="mcp-authorize-note"><strong>Somente leitura.</strong> Você pode revogar esta autorização quando quiser.</p><div className="mcp-authorize-actions"><button disabled={pending} onClick={() => void decide(true)} type="button">{pending ? 'Autorizando…' : 'Autorizar acesso'}</button><button disabled={pending} onClick={() => void decide(false)} type="button">Cancelar</button></div>{message ? <p aria-live="polite">{message}</p> : null}</section></main>
}
