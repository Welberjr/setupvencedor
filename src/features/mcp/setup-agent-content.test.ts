import { expect, it } from 'vitest'
import { createSetupAgentContent } from './setup-agent-content'

it('uses the canonical OAuth resource for every production origin', () => {
  for (const origin of ['https://setupvencedor.com.br', 'https://www.setupvencedor.com.br/', 'https://setup-vencedor-worker.filmesecia-df.workers.dev']) {
    const content = createSetupAgentContent(origin)
    expect(content.endpoint).toBe('https://setupvencedor.com.br/api/mcp')
    expect(content.manualConfigs[0].code).toBe('codex mcp add setup-agent --url https://setupvencedor.com.br/api/mcp\ncodex mcp login setup-agent')
    expect(content.manualConfigs[1].code).toContain('--transport http setup-agent')
  }
})

it('builds the Setup Agent instructions for the current staging Worker origin', () => {
  const content = createSetupAgentContent('https://setup-vencedor-worker-staging.example.workers.dev')

  expect(content.endpoint).toBe('https://setup-vencedor-worker-staging.example.workers.dev/api/mcp')
  expect(content.manualConfigs[0].code).toContain('https://setup-vencedor-worker-staging.example.workers.dev/api/mcp')
})
