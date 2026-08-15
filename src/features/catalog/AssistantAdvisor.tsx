import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Square } from 'lucide-react'
import { workerUrl } from '../../lib/api/worker'
import { getSupabaseClient } from '../../lib/supabase/client'

export type AssistantResource = { id: string; title: string; item_type: string; category: string; summary: string; official_url: string; instructions: string }
export type AssistantResponse = { query: string; transcript?: string; mode: 'ai' | 'fallback'; summary: string; recommendations: Array<{ id: string; why: string; firstStep: string }>; resources: AssistantResource[] }

type AssistantAdvisorProps = { onResult: (result: AssistantResponse) => void }

const maxRecordingSeconds = 120
const contextHints = ['Codex', 'Claude Code', 'Começar do zero', 'Melhorar uma existente']

function messageFor(error: unknown): string {
  const code = error instanceof Error ? error.message : 'assistant_not_available'
  if (code === 'assistant_rate_limited') return 'Você atingiu o limite temporário de consultas. Aguarde alguns minutos para tentar novamente.'
  if (code === 'invalid_audio' || code === 'audio_too_long') return 'Envie um áudio válido de até 120 segundos.'
  if (code === 'audio_without_transcript') return 'Não conseguimos identificar uma fala no áudio. Tente gravar novamente.'
  if (code === 'unauthorized' || code === 'forbidden') return 'Sua sessão expirou ou não tem acesso ao Assistente. Entre novamente.'
  return 'O Assistente está indisponível neste instante. Tente novamente em alguns segundos.'
}

export function AssistantAdvisor({ onResult }: AssistantAdvisorProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | undefined>(undefined)
  const durationRef = useRef(0)

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); recorderRef.current?.stream.getTracks().forEach((track) => track.stop()) }, [])

  async function send(formData?: FormData) {
    if (!formData && query.trim().length < 3) { setStatus('Descreva o que você quer construir com pelo menos três caracteres.'); return }
    setLoading(true); setStatus('')
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase?.auth.getSession() ?? { data: { session: null } }
      if (!data.session?.access_token) throw new Error('unauthorized')
      const response = await fetch(workerUrl('/v1/assistant/recommendations'), formData ? { method: 'POST', headers: { authorization: `Bearer ${data.session.access_token}` }, body: formData } : { method: 'POST', headers: { authorization: `Bearer ${data.session.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }) })
      const body = await response.json() as AssistantResponse & { error?: string }
      if (!response.ok) throw new Error(body.error)
      onResult(body); setQuery(body.query)
    } catch (error) { setStatus(messageFor(error)) } finally { setLoading(false) }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setStatus('A gravação de áudio não é suportada neste navegador.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
        setRecording(false)
        stream.getTracks().forEach((track) => track.stop())
        const duration = durationRef.current || 1
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (!blob.size) { setStatus('A gravação ficou vazia. Tente novamente.'); return }
        const formData = new FormData(); formData.set('audio', new File([blob], 'necessidade.webm', { type: blob.type })); formData.set('audioDurationSeconds', String(duration))
        void send(formData)
      }
      recorder.start(1000); recorderRef.current = recorder; durationRef.current = 0; setRecordingSeconds(0); setRecording(true); setStatus('Gravando. Você pode explicar seu contexto por até 120 segundos.')
      timerRef.current = window.setInterval(() => setRecordingSeconds((current) => { const next = current + 1; durationRef.current = next; if (next >= maxRecordingSeconds) { recorder.stop(); return maxRecordingSeconds } return next }), 1000)
    } catch { setStatus('Não foi possível acessar o microfone. Verifique a permissão do navegador.') }
  }

  function stopRecording() { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }

  function addContextHint(hint: string) {
    setQuery((current) => current.toLocaleLowerCase('pt-BR').includes(hint.toLocaleLowerCase('pt-BR')) ? current : `${current.trim()} ${hint}`.trim())
  }

  return <section className="assistant-advisor" aria-labelledby="assistant-title">
    <div className="assistant-composer">
      <label htmlFor="assistant-query">Conte o resultado que você quer alcançar</label>
      <textarea id="assistant-query" disabled={loading || recording} maxLength={1500} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: preciso testar uma aplicação com IA, validar a interface e publicar na Cloudflare." value={query} />
      <div className="assistant-context-hints">
        <p>Quer uma indicação mais certeira? Escolha seu cliente e o ponto de partida.</p>
        <div>{contextHints.map((hint) => <button key={hint} disabled={loading || recording} onClick={() => addContextHint(hint)} type="button">{hint}</button>)}</div>
      </div>
      <div className="assistant-composer-actions">
        {recording ? <button className="recording-button" onClick={stopRecording} type="button"><Square size={17} /> Parar · {recordingSeconds}s / 120s</button> : <button className="voice-button" disabled={loading} onClick={() => void startRecording()} type="button"><Mic size={17} /> Explicar por áudio</button>}
        <button className="advisor-submit" disabled={loading || recording} onClick={() => void send()} type="button"><Send size={17} /> {loading ? 'Analisando…' : 'Encontrar caminhos'}</button>
      </div>
      <p className="assistant-note">A voz é transcrita só para esta consulta e não fica salva. Até 120 segundos.</p>
      {status ? <p className="assistant-status" role="status">{status}</p> : null}
    </div>
  </section>
}
