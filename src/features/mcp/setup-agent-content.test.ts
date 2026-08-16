import { expect, it } from 'vitest'
import { createSetupAgentContent } from './setup-agent-content'

it('builds the Setup Agent instructions for the current staging Worker origin', () => {
  const content = createSetupAgentContent('https://setup-vencedor-worker-staging.example.workers.dev')

  expect(content.endpoint).toBe('https://setup-vencedor-worker-staging.example.workers.dev/api/mcp')
  expect(content.manualConfigs[0].code).toContain('https://setup-vencedor-worker-staging.example.workers.dev/api/mcp')
})
