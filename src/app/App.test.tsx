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

it('reveals category filters directly from the compact Explore button', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.queryByText(/Encontre o caminho para a sua próxima decisão/i)).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Filtrar acervo')).not.toBeInTheDocument()

  expect(screen.queryByRole('button', { name: /Filtrar acervo/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Explorar e filtrar categorias' }))

  expect(screen.getByLabelText('Filtrar acervo')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /MCPS/i }))

  expect(screen.getByText(/itens em mcps/i)).toBeInTheDocument()
  expect(screen.queryByLabelText('Filtrar acervo')).not.toBeInTheDocument()
})

it('shows the dedicated assistant composer without catalog cards before a request', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))

  expect(screen.getByLabelText(/Conte o resultado/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Explicar por áudio/i })).toBeInTheDocument()
  expect(screen.queryByText(/RECOMENDAÇÃO INTELIGENTE/i)).not.toBeInTheDocument()
})

it('uses assistant copy without dash separators', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))

  expect(screen.getByText('Explique com suas palavras ou por voz. Você receberá uma trilha com os recursos certos para começar.')).toBeInTheDocument()
})

it('keeps the assistant response summary in a concise visual heading', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))

  expect(screen.queryByRole('heading', { name: /Para um assistente pessoal/i })).not.toBeInTheDocument()
})

it('shows catalog pagination with the current page status', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByRole('navigation', { name: 'Paginação do acervo' })).toBeInTheDocument()
  expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
})

it('does not show a keyboard shortcut hint in the catalog search', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByLabelText('Buscar no acervo')).toBeInTheDocument()
  expect(screen.queryByText('⌘ K')).not.toBeInTheDocument()
})

it('keeps the official shell unchanged by default', () => {
  const { container } = render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(container.querySelector('.app-shell')).toHaveClass('command-center')
  expect(screen.queryByText('LABORATÓRIO VISUAL · DADOS REAIS')).not.toBeInTheDocument()
})

it('scopes the handdrawn lab and warns that actions use real data', () => {
  const { container } = render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(container.querySelector('.app-shell')).toHaveClass('handdrawn-lab')
  expect(screen.getByText('LABORATÓRIO VISUAL · DADOS REAIS')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('href', 'https://www.setupvencedor.com.br/')
})
