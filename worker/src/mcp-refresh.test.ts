import { afterEach, expect, it, vi } from 'vitest'
import worker from './index'
import type { Env } from './env'
import { hashSecret, validateMcpAccessToken } from './oauth'

const env = { SUPABASE_URL: 'https://database.example', SUPABASE_SERVICE_ROLE_KEY: 'test-key', MCP_OAUTH_SIGNING_KEY: 'test-signing-key-long-enough', MCP_PUBLIC_ORIGIN: 'https://setupvencedor.com.br' } as Env
const resource = 'https://setupvencedor.com.br/api/mcp'
const oldToken = 'test-refresh-token'
afterEach(() => vi.unstubAllGlobals())

async function database(options: { expired?: boolean; revoked?: boolean; inactive?: boolean; noConsent?: boolean; disabled?: boolean; claimLost?: boolean; insertFails?: boolean } = {}) {
  let rotated = false
  const writes: Array<{ path: string; body: Record<string, unknown> }> = []
  vi.stubGlobal('fetch', vi.fn(async (url: unknown, init?: RequestInit) => {
    const path = String(url)
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    if (method !== 'GET') writes.push({ path, body })
    if (path.includes('/profiles')) return Response.json(options.inactive ? null : { id: 'user' })
    if (path.includes('/mcp_oauth_clients')) return Response.json(options.disabled ? null : { client_id: 'client' })
    if (path.includes('/mcp_consents')) return Response.json(options.noConsent ? null : { id: 'consent', scope: 'mcp:read' })
    if (method === 'PATCH') {
      if (body.rotated_at) { if (options.claimLost) return Response.json(null); rotated = true }
      return Response.json({ id: 'old' })
    }
    if (method === 'POST') return options.insertFails ? Response.json({ message: 'unavailable' }, { status: 503 }) : new Response(null, { status: 201 })
    return Response.json({ id: 'old', token_hash: await hashSecret(oldToken), user_id: 'user', client_id: 'client', scope: 'mcp:read', resource, expires_at: new Date(Date.now() + (options.expired ? -1000 : 86400000)).toISOString(), rotated_at: rotated ? new Date().toISOString() : null, revoked_at: options.revoked ? new Date().toISOString() : null })
  }))
  return writes
}

function refresh(overrides: Record<string, string> = {}) {
  return worker.fetch(new Request('https://setupvencedor.com.br/api/oauth/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: oldToken, client_id: 'client', ...overrides }) }), env)
}

it('rotates a refresh token, stores only its hash and rejects reuse', async () => {
  const writes = await database()
  const response = await refresh()
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const auth = await response.json() as { access_token: string; refresh_token: string }
  expect(auth.refresh_token).not.toBe(oldToken)
  await expect(validateMcpAccessToken(auth.access_token, env)).resolves.toMatchObject({ userId: 'user', clientId: 'client' })
  const stored = writes.find(write => write.body.token_hash)
  expect(stored?.body.token_hash).toBe(await hashSecret(auth.refresh_token))
  expect(JSON.stringify(writes)).not.toContain(auth.refresh_token)
  expect(await (await refresh()).json()).toEqual({ error: 'invalid_grant' })
  expect(writes.some(write => write.path.includes('mcp_consents') && write.body.revoked_at)).toBe(true)
})

it.each(['expired', 'revoked', 'inactive', 'noConsent', 'disabled', 'claimLost'] as const)('rejects %s sessions without minting credentials', async flag => {
  const writes = await database({ [flag]: true })
  expect(await (await refresh()).json()).toEqual({ error: 'invalid_grant' })
  expect(writes.some(write => write.body.token_hash)).toBe(false)
})

it.each([
  [{ client_id: 'other' }, 'invalid_grant'],
  [{ resource: 'https://other.example/api/mcp' }, 'invalid_target'],
  [{ scope: 'mcp:write' }, 'invalid_scope'],
  [{ refresh_token: '' }, 'invalid_request'],
] as const)('rejects a mismatched or incomplete refresh request', async (overrides, error) => {
  await database()
  expect(await (await refresh(overrides)).json()).toEqual({ error })
})

it('does not expose a token when persistence fails', async () => {
  await database({ insertFails: true })
  const response = await refresh()
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: 'temporarily_unavailable' })
})
