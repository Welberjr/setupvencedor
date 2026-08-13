import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { RichTextComposer } from './RichTextComposer'
import { SUPPORT_ATTACHMENT_ACCEPT, toSupportPlainText, validateSupportAttachment } from './rich-text'

export type TicketInput = {
  type: 'question' | 'access' | 'bug' | 'suggestion' | 'other'
  subject: string
  body: string
  bodyRich: string
  attachment?: File
}

export function TicketForm({ onCreate }: { onCreate: (input: TicketInput) => Promise<void> | void }) {
  const [type, setType] = useState<TicketInput['type']>('question')
  const [subject, setSubject] = useState('')
  const [bodyRich, setBodyRich] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const body = toSupportPlainText(bodyRich)

  function chooseAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const error = validateSupportAttachment(file)
    if (error) { setAttachment(null); setAttachmentError(error); event.target.value = ''; return }
    setAttachment(file); setAttachmentError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (subject.trim().length < 3 || body.length < 1 || isSubmitting) return
    setIsSubmitting(true); setSubmitError('')
    try {
      const input: TicketInput = { type, subject: subject.trim(), body, bodyRich }
      if (attachment) input.attachment = attachment
      await onCreate(input)
      setSubject(''); setBodyRich(''); setAttachment(null); setAttachmentError('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setSubmitError('Não foi possível enviar o chamado agora. Tente novamente em instantes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <form className="ticket-form" onSubmit={submit}>
    <label>Tipo<select aria-label="Tipo" value={type} onChange={(event) => setType(event.target.value as TicketInput['type'])}><option value="question">Dúvida</option><option value="access">Acesso</option><option value="bug">Reportar bug</option><option value="suggestion">Sugestão</option><option value="other">Outro</option></select></label>
    <label>Assunto<input aria-label="Assunto" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
    <label>Mensagem<RichTextComposer onChange={setBodyRich} value={bodyRich} /><small>Use a formatação para deixar a situação mais clara.</small></label>
    <div className="attachment-field"><input accept={SUPPORT_ATTACHMENT_ACCEPT} aria-label="Anexar imagem" className="sr-only" onChange={chooseAttachment} ref={fileInputRef} type="file" /><button className="attachment-trigger" onClick={() => fileInputRef.current?.click()} type="button">Anexar imagem</button><span>{attachment ? attachment.name : 'PNG, JPEG ou WebP — até 5 MB'}</span>{attachment ? <button aria-label="Remover anexo" className="attachment-remove" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = '' }} type="button">Remover</button> : null}</div>
    {attachmentError ? <p role="alert">{attachmentError}</p> : null}
    {submitError ? <p role="alert">{submitError}</p> : null}
    <button className="primary" disabled={isSubmitting} type="submit">{isSubmitting ? 'Enviando chamado…' : 'Enviar chamado'}</button>
  </form>
}
