import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { TicketForm } from './TicketForm'

it('creates a support request with the selected category', async () => {
  const user = userEvent.setup()
  const onCreate = vi.fn()
  render(<TicketForm onCreate={onCreate} />)
  await user.selectOptions(screen.getByLabelText('Tipo'), 'access')
  await user.type(screen.getByLabelText('Assunto'), 'Não consigo entrar')
  await user.type(screen.getByLabelText('Mensagem'), 'A senha não está sendo aceita no meu acesso.')
  await user.click(screen.getByRole('button', { name: 'Enviar chamado' }))
  expect(onCreate).toHaveBeenCalledWith({ type: 'access', subject: 'Não consigo entrar', body: 'A senha não está sendo aceita no meu acesso.', bodyRich: 'A senha não está sendo aceita no meu acesso.' })
})

it('offers rich text controls and an image attachment', () => {
  render(<TicketForm onCreate={vi.fn()} />)

  expect(screen.getByRole('button', { name: 'Negrito' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Itálico' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sublinhar' })).toBeInTheDocument()
  expect(screen.getByLabelText('Anexar imagem')).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp')
})
