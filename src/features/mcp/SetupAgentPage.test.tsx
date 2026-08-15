import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SetupAgentPage } from './SetupAgentPage'
import { setupAgentEndpoint, setupAgentInstallPrompt } from './setup-agent-content'

it('explains the protected Setup Agent connection and offers a one-click install prompt', async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

  render(<SetupAgentPage />)

  expect(screen.getByRole('heading', { name: /conecte seu agente ao acervo/i })).toBeInTheDocument()
  expect(screen.getAllByText(setupAgentEndpoint).length).toBeGreaterThan(0)
  expect(screen.getByText('search_resources')).toBeInTheDocument()
  expect(screen.getByText('recommend_for_project')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /copiar configuração para codex/i }))

  expect(writeText).toHaveBeenCalledWith(setupAgentInstallPrompt)
  expect(screen.getByText(/configuração copiada/i)).toBeInTheDocument()
})
