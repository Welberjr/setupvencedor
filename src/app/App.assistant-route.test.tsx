import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi, expect, it } from 'vitest'

const assistedRoute = {
  client: { id: 'codex' as const, label: 'Codex' },
  mode: 'ai' as const,
  query: 'Automatizar artes para o Instagram',
  recommendations: [{ id: 'hooks', why: 'Cria verificações antes de publicar.', firstStep: 'Abra a documentação.', installation: 'Instale e teste no projeto de exemplo.', prompt: 'Me ajude a configurar hooks.', nextStep: 'Valide uma publicação de teste.' }],
  resources: [{ id: 'hooks', title: 'Hooks do Claude Code', item_type: 'Tutorial', category: 'Tutoriais', summary: 'Automação segura.', official_url: 'https://example.com', instructions: 'Teste primeiro.' }],
  summary: 'Comece com Hooks do Claude Code para validar a automação antes de publicar.',
}

vi.mock('../features/catalog/AssistantAdvisor', () => ({
  AssistantAdvisor: ({ onResult }: { onResult: (result: typeof assistedRoute) => void }) => <button onClick={() => onResult(assistedRoute)} type="button">Desenhar minha rota</button>,
}))

import { App } from './App'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('turns an assistant answer into a compact drawn route instead of a giant heading', async () => {
  const user = userEvent.setup()
  render(<App visualMode="handdrawn-lab" session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)

  await user.click(screen.getByRole('button', { name: 'Assistente' }))
  await user.click(screen.getByRole('button', { name: 'Desenhar minha rota' }))

  expect(screen.getByRole('heading', { name: 'Sua rota desenhada.' })).toBeInTheDocument()
  expect(screen.getByText(assistedRoute.summary)).toHaveClass('assistant-route-summary')
  expect(screen.queryByRole('heading', { name: assistedRoute.summary })).not.toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Como seguir esta rota' })).toBeInTheDocument()
})
