import { useState } from 'react'

export function WorkspaceNamePrompt({ onSave }: { onSave: (displayName: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const displayName = name.trim()
    if (displayName.length < 1 || displayName.length > 40) {
      setMessage('Use entre 1 e 40 caracteres.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await onSave(displayName)
    } catch {
      setMessage('Não foi possível salvar seu nome agora. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return <div aria-labelledby="workspace-name-title" className="workspace-name-backdrop" role="presentation">
    <form aria-label="Como você quer aparecer no acervo?" className="workspace-name-dialog" onSubmit={save} role="dialog">
      <p className="eyebrow">SEU CADERNO</p>
      <h2 id="workspace-name-title">Como você quer aparecer no acervo?</h2>
      <p>Use o nome que faz sentido para você. Seu e-mail continua protegido na sua conta.</p>
      <label>Seu nome no acervo<input aria-label="Seu nome no acervo" autoComplete="name" autoFocus maxLength={40} onChange={(event) => setName(event.target.value)} value={name} /></label>
      {message ? <p role="alert">{message}</p> : null}
      <button className="primary" disabled={saving} type="submit">{saving ? 'Salvando…' : 'Continuar'}</button>
    </form>
  </div>
}
