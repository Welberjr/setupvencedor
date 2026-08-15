import { expect, it } from 'vitest'
import { createMcpAccessToken, oauthMetadata, protectedResourceMetadata, validateMcpAccessToken } from './oauth'

const env = {
  MCP_OAUTH_SIGNING_KEY: 'test-signing-key-with-at-least-thirty-two-bytes',
  MCP_PUBLIC_ORIGIN: 'https://setupvencedor.com.br',
  MCP_ACCESS_TOKEN_TTL_SECONDS: '900',
} as const

it('publishes canonical MCP OAuth discovery metadata', () => {
  expect(protectedResourceMetadata(env)).toMatchObject({ resource: 'https://setupvencedor.com.br/api/mcp' })
  expect(oauthMetadata(env)).toMatchObject({ authorization_endpoint: 'https://setupvencedor.com.br/api/oauth/authorize' })
})

it('accepts only a signed token for the Setup Agent resource', async () => {
  const token = await createMcpAccessToken({ userId: '00000000-0000-0000-0000-0000000000a1', clientId: 'test-client', scopes: ['mcp:read'] }, env)
  await expect(validateMcpAccessToken(token, env)).resolves.toMatchObject({ userId: '00000000-0000-0000-0000-0000000000a1' })
})

it('binds a default access token to the configured staging MCP origin', async () => {
  const stagingEnv = { ...env, MCP_PUBLIC_ORIGIN: 'https://staging.setup-vencedor-staging.pages.dev' }
  const token = await createMcpAccessToken({ userId: '00000000-0000-0000-0000-0000000000a1', clientId: 'test-client', scopes: ['mcp:read'] }, stagingEnv)

  await expect(validateMcpAccessToken(token, stagingEnv)).resolves.toMatchObject({ clientId: 'test-client' })
  await expect(validateMcpAccessToken(token, env)).rejects.toThrow('invalid_token')
})
