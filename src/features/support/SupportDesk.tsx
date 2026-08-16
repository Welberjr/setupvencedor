import { useState } from 'react'
import { hasAnyRole, type Role } from '../../lib/roles'
import { canTransitionTicket, type TicketStatus } from './status'

export type SupportDeskTicket = {
  id: string
  subject: string
  type: string
  status: TicketStatus
  createdAt: string
  lastActivityAt: string
}

const statusLabel: Record<TicketStatus, string> = {
  open: 'Aberto',
  answered: 'Respondido',
  closed: 'Fechado',
  finalized: 'Finalizado',
}

const transitions: Record<TicketStatus, Array<{ next: TicketStatus; label: string }>> = {
  open: [{ next: 'answered', label: 'Marcar como respondido' }, { next: 'closed', label: 'Fechar chamado' }],
  answered: [{ next: 'closed', label: 'Fechar chamado' }],
  closed: [{ next: 'open', label: 'Reabrir chamado' }, { next: 'finalized', label: 'Finalizar chamado' }],
  finalized: [],
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function SupportDesk({
  tickets,
  roles,
  currentUserId: _currentUserId,
  onChangeStatus,
  onAddInternalNote,
  onReply,
}: {
  tickets: SupportDeskTicket[]
  roles: Role[]
  currentUserId: string
  onChangeStatus: (ticketId: string, next: TicketStatus) => Promise<void> | void
  onAddInternalNote: (ticketId: string, body: string) => Promise<void> | void
  onReply: (ticketId: string, body: string) => Promise<void> | void
}) {
  const [noteByTicket, setNoteByTicket] = useState<Record<string, string>>({})
  const [replyByTicket, setReplyByTicket] = useState<Record<string, string>>({})
  const isAgent = hasAnyRole(roles, ['admin', 'manager'])

  return <section className="support-desk" aria-label={isAgent ? 'Central de atendimento' : 'Histórico de chamados'}>
    <div className="support-desk-heading"><h2>{isAgent ? 'Central de atendimento' : 'Seus chamados'}</h2><p>{isAgent ? 'Acompanhe, responda e deixe notas internas sem expor a equipe ao solicitante.' : 'Acompanhe o andamento dos seus chamados por aqui.'}</p></div>
    {!tickets.length ? <p className="empty-state">Ainda não há chamados neste espaço. Quando você abrir um, o acompanhamento aparecerá aqui.</p> : null}
    <div className="support-ticket-list">
      {tickets.map((ticket) => <article className="support-ticket-card" key={ticket.id}>
        <div className="support-ticket-summary"><span className={`support-status support-status-${ticket.status}`}>{statusLabel[ticket.status]}</span><h3>{ticket.subject}</h3><p>{ticket.type} · Atualizado em {dateLabel(ticket.lastActivityAt)}</p></div>
        {isAgent ? <div className="support-ticket-actions">
          {transitions[ticket.status].filter(({ next }) => canTransitionTicket(ticket.status, next, roles)).map(({ next, label }) => <button key={next} onClick={() => void onChangeStatus(ticket.id, next)} type="button">{label}</button>)}
          <label>Resposta ao solicitante<textarea aria-label="Resposta ao solicitante" onChange={(event) => setReplyByTicket((replies) => ({ ...replies, [ticket.id]: event.target.value }))} value={replyByTicket[ticket.id] ?? ''} /></label>
          <button disabled={!replyByTicket[ticket.id]?.trim()} onClick={() => { const reply = replyByTicket[ticket.id]?.trim(); if (!reply) return; void onReply(ticket.id, reply); setReplyByTicket((replies) => ({ ...replies, [ticket.id]: '' })) }} type="button">Enviar resposta</button>
          <label>Nota interna<textarea aria-label="Nota interna" onChange={(event) => setNoteByTicket((notes) => ({ ...notes, [ticket.id]: event.target.value }))} value={noteByTicket[ticket.id] ?? ''} /></label>
          <button disabled={!noteByTicket[ticket.id]?.trim()} onClick={() => { const note = noteByTicket[ticket.id]?.trim(); if (!note) return; void onAddInternalNote(ticket.id, note); setNoteByTicket((notes) => ({ ...notes, [ticket.id]: '' })) }} type="button">Salvar nota interna</button>
        </div> : null}
      </article>)}
    </div>
  </section>
}
