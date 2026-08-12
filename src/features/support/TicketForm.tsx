import { useState, type FormEvent } from 'react'

type TicketInput = { type: 'question' | 'access' | 'bug' | 'suggestion' | 'other'; subject: string; body: string }

export function TicketForm({ onCreate }: { onCreate: (input: TicketInput) => void }) {
  const [type, setType] = useState<TicketInput['type']>('question')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (subject.trim().length < 3 || body.trim().length < 1) return
    onCreate({ type, subject: subject.trim(), body: body.trim() })
    setSubject(''); setBody('')
  }
  return <form className="ticket-form" onSubmit={submit}><label>Tipo<select aria-label="Tipo" value={type} onChange={(event) => setType(event.target.value as TicketInput['type'])}><option value="question">Dúvida</option><option value="access">Acesso</option><option value="bug">Reportar bug</option><option value="suggestion">Sugestão</option><option value="other">Outro</option></select></label><label>Assunto<input aria-label="Assunto" value={subject} onChange={(event) => setSubject(event.target.value)} /></label><label>Mensagem<textarea aria-label="Mensagem" value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="primary" type="submit">Enviar chamado</button></form>
}
