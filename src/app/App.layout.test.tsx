import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from './App'

it('uses a centered, label-free heading in the assistant', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))

  expect(screen.getByRole('heading', { name: 'O que você precisa construir?' })).toHaveClass('page-title')
  expect(screen.queryByText('ASSISTENTE DO ACERVO')).not.toBeInTheDocument()
})

it('uses the illustrated Explore heading only inside the lab', () => {
  const { rerender } = render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.queryByText(/recursos para descobrir/i)).not.toBeInTheDocument()

  rerender(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByText(/recursos para descobrir/i)).toBeInTheDocument()
})
