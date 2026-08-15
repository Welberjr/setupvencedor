import { useState, type FormEvent } from 'react'
import { getSupabaseClient } from '../../lib/supabase/client'
import { AuthArtwork } from '../handdrawn/AuthArtwork'
import type { VisualMode } from '../handdrawn/visual-mode'

export function ResetPasswordPage({ visualMode = 'command-center' }: { visualMode?: VisualMode }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 12) { setMessage('Use uma senha forte com pelo menos 12 caracteres.'); return }
    const client = getSupabaseClient()
    if (!client) { setMessage('A conexão segura ainda não está configurada.'); return }
    const { error } = await client.auth.updateUser({ password })
    if (error) { setMessage('O link expirou. Solicite uma nova recuperação de senha.'); return }
    setMessage('Senha atualizada. Você já pode entrar.')
  }
  return <main className={`app-shell auth-shell ${visualMode}`}>{visualMode === 'handdrawn-lab' ? <AuthArtwork /> : null}<form className="auth-form" onSubmit={submit}><p className="eyebrow">RECUPERAR SENHA</p><h1>Defina uma nova senha.</h1><label>Nova senha<input aria-label="Nova senha" autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message ? <p role="alert">{message}</p> : null}<button className="primary" type="submit">Salvar nova senha</button></form></main>
}
