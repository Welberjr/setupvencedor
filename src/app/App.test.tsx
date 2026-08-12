import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from './App'

it('renders the protected application shell after a session is supplied', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
})

it('renders the login form when no session is supplied', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})

it('opens an individual detail panel from the catalog', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getAllByRole('button', { name: /ver detalhes/i })[0])

  expect(screen.getByRole('dialog', { name: /detalhes do recurso/i })).toBeInTheDocument()
  expect(screen.getByText(/como a equipe pode usar/i)).toBeInTheDocument()
})

it('filters the catalog by a discovery niche', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  const mcpButtons = screen.getAllByRole('button', { name: /mcps/i })
  await user.click(mcpButtons[mcpButtons.length - 1])

  expect(screen.getByText(/itens em mcps/i)).toBeInTheDocument()
})

it('shows catalog pagination with the current page status', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByRole('navigation', { name: 'Paginação do acervo' })).toBeInTheDocument()
  expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
})
