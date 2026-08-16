import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SupportDesk } from './SupportDesk'

const tickets = [
  { id: 'ticket-1', subject: 'Não consigo entrar', type: 'access', status: 'open' as const, createdAt: '2026-08-16T12:00:00.000Z', lastActivityAt: '2026-08-16T12:00:00.000Z' },
]

it('shows a member only their support history without internal controls', () => {
  render(<SupportDesk currentUserId="member-1" onAddInternalNote={vi.fn()} onChangeStatus={vi.fn()} onReply={vi.fn()} roles={['member']} tickets={tickets} />)

  expect(screen.getByText('Não consigo entrar')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Marcar como respondido' })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Nota interna')).not.toBeInTheDocument()
})

it('lets a manager answer a ticket, reply, and record a private note', async () => {
  const user = userEvent.setup()
  const onChangeStatus = vi.fn()
  const onAddInternalNote = vi.fn()
  const onReply = vi.fn()
  render(<SupportDesk currentUserId="manager-1" onAddInternalNote={onAddInternalNote} onChangeStatus={onChangeStatus} onReply={onReply} roles={['manager']} tickets={tickets} />)

  await user.click(screen.getByRole('button', { name: 'Marcar como respondido' }))
  await user.type(screen.getByLabelText('Resposta ao solicitante'), 'Já ajustamos o acesso; tente novamente.')
  await user.click(screen.getByRole('button', { name: 'Enviar resposta' }))
  await user.type(screen.getByLabelText('Nota interna'), 'Conta revisada; aguardando retorno.')
  await user.click(screen.getByRole('button', { name: 'Salvar nota interna' }))

  expect(onChangeStatus).toHaveBeenCalledWith('ticket-1', 'answered')
  expect(onReply).toHaveBeenCalledWith('ticket-1', 'Já ajustamos o acesso; tente novamente.')
  expect(onAddInternalNote).toHaveBeenCalledWith('ticket-1', 'Conta revisada; aguardando retorno.')
})
