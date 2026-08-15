import { expect, it } from 'vitest'
import { createSetupAgentContent } from './setup-agent-content'

it('builds the Setup Agent instructions for the current staging origin', () => {
  const content = createSetupAgentContent('https://staging.setup-vencedor-staging.pages.dev')

  expect(content.endpoint).toBe('https://staging.setup-vencedor-staging.pages.dev/api/mcp')
  expect(content.manualConfigs[0].code).toContain('https://staging.setup-vencedor-staging.pages.dev/api/mcp')
})
