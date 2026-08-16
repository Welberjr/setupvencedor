import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

it('renders the protected application shell after a session is supplied', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
})

it('opens with a free access path when no session is supplied', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Criar meu acesso grátis' })).toBeInTheDocument()
  expect(screen.getByText(/100% gratuito/i)).toBeInTheDocument()
})

it('keeps the community invitation visible after email confirmation', () => {
  window.history.replaceState({}, '', '/boas-vindas')
  render(<App />)

  expect(screen.getByRole('heading', { name: /Seu acesso está confirmado/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Entrar na comunidade do WhatsApp/i })).toHaveAttribute('href', 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr')
})

it('opens every catalog item in a full editorial resource page', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getAllByRole('button', { name: /ver detalhes/i })[0])

  expect(screen.queryByRole('dialog', { name: /detalhes do recurso/i })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Frontend Design', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Acople a capacidade certa' })).toBeInTheDocument()
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

it('keeps Setup Agent available in the primary navigation for MCP installation', async () => {
  const user = userEvent.setup()
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Setup Agent' }))

  expect(screen.getByRole('heading', { name: /conecte seu agente ao acervo/i })).toBeInTheDocument()
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

it('renders the laboratory warning only when the laboratory marker is enabled', () => {
  const session = { user: { id: 'u1', email: 'dev@example.com' } }
  const { container, rerender } = render(<App visualMode="handdrawn-lab" session={session} />)

  expect(container.querySelector('.app-shell')).toHaveClass('handdrawn-lab')
  expect(screen.queryByText('LABORATÓRIO VISUAL · DADOS REAIS')).not.toBeInTheDocument()

  rerender(<App showLabBadge visualMode="handdrawn-lab" session={session} />)

  expect(screen.getByText('LABORATÓRIO VISUAL · DADOS REAIS')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('href', 'https://www.setupvencedor.com.br/')
})

it('keeps all primary Explore actions available in the handdrawn lab', async () => {
  const user = userEvent.setup()
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByLabelText('Buscar no acervo')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Paginação do acervo' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Explorar e filtrar categorias' }))

  expect(screen.getByLabelText('Filtrar acervo')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /Ver detalhes/i }).length).toBeGreaterThan(0)
})

it('keeps an unnamed workspace account neutral instead of exposing the email in the rail', () => {
  const { container } = render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'welber.especialistadigital@gmail.com' } }} />)

  expect(container.querySelector('.topbar')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Conta da área de trabalho')).toHaveTextContent('Seu perfil')
  expect(screen.getByLabelText('Conta da área de trabalho')).not.toHaveTextContent('welber.especialistadigital@gmail.com')
  expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument()
  expect(screen.getByText('BEM-VINDO AO ACERVO')).toBeInTheDocument()
})

it('shows the chosen workspace name and keeps the email available as a tooltip', () => {
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'welber.especialistadigital@gmail.com', displayName: 'Welber' } }} />)

  expect(screen.getByLabelText('Conta da área de trabalho')).toHaveTextContent('Welber')
  expect(screen.getByTitle('welber.especialistadigital@gmail.com')).toHaveTextContent('Welber')
  expect(screen.queryByText('Base privada ativa')).not.toBeInTheDocument()
})

it('opens the centered account menu with a clear sign-out action', async () => {
  const user = userEvent.setup()
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'welber.especialistadigital@gmail.com', displayName: 'Welber' } }} />)

  await user.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))

  expect(screen.getByRole('menu', { name: 'Menu da conta' })).toHaveTextContent('Conta conectada')
  expect(screen.getByRole('menu', { name: 'Menu da conta' })).not.toHaveTextContent('Comunidade WhatsApp')
  expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
})

it('keeps the community link available inside the signed-in workspace', () => {
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com', displayName: 'Dev' } }} />)

  expect(screen.getByRole('link', { name: /Comunidade WhatsApp/ })).toHaveAttribute('href', 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr')
})

it('asks for a workspace name when a handdrawn session has none', () => {
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  expect(screen.getByRole('dialog', { name: 'Como você quer aparecer no acervo?' })).toBeInTheDocument()
  expect(screen.getByLabelText('Seu nome no acervo')).toBeInTheDocument()
})

it('gives every signed-in workspace area its own handdrawn illustration', async () => {
  const user = userEvent.setup()
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' }, roles: ['admin'] }} />)

  expect(screen.getByRole('img', { name: /Biblioteca desenhada/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Assistente' }))
  expect(screen.getByRole('img', { name: /Agentes e tarefas ligados/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Favoritos' }))
  expect(screen.getByRole('img', { name: /Caderno desenhado/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Suporte' }))
  expect(screen.getByRole('img', { name: /Bancada de suporte/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Administração' }))
  expect(screen.getByRole('img', { name: /Biblioteca privada desenhada/i })).toBeInTheDocument()
})

it('turns the public access page into a handdrawn welcome page only in the lab', () => {
  const { rerender } = render(<App />)
  expect(screen.getByRole('button', { name: 'Criar meu acesso grátis' })).toBeInTheDocument()

  rerender(<App visualMode="handdrawn-lab" />)
  expect(screen.getByText('QUER QUE EU DESENHE?')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Criar meu acesso grátis' })).toBeInTheDocument()
})

it('returns to the top when the user changes workspace area', async () => {
  const user = userEvent.setup()
  const scrollTo = vi.mocked(window.scrollTo)
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))

  expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' })
})
