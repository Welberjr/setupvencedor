import { afterEach, expect, it, vi } from 'vitest'
import worker from './index'
import { createMcpAccessToken, validateMcpAccessToken } from './oauth'
import type { Env } from './env'

const env = {
  SUPABASE_URL: 'https://database.example', SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  MCP_OAUTH_SIGNING_KEY: 'test-signing-key-with-at-least-thirty-two-bytes',
  MCP_PUBLIC_ORIGIN: 'https://setupvencedor.com.br',
} as Env
const endpoint = 'https://setupvencedor.com.br/api/oauth/token'
const verifier = 'a'.repeat(43)
const fields = { grant_type: 'authorization_code', client_id: 'client-test', code: 'one-use-code', redirect_uri: 'http://127.0.0.1:51234/callback/test', code_verifier: verifier }
afterEach(() => vi.unstubAllGlobals())

it.each([
  ['application/x-www-form-urlencoded', 'grant_type=client_credentials', 'unsupported_grant_type'],
  ['application/x-www-form-urlencoded', 'grant_type=authorization_code', 'invalid_request'],
  ['application/x-www-form-urlencoded', 'grant_type=authorization_code&grant_type=other', 'invalid_request'],
  ['application/json', '{broken', 'invalid_request'],
  ['application/json', 'null', 'invalid_request'],
  ['application/json', '{"grant_type":123}', 'invalid_request'],
  ['text/plain', 'grant_type=authorization_code', 'invalid_request'],
])('returns an OAuth JSON error for %s %s', async (contentType, body, error) => {
  const response = await worker.fetch(new Request(endpoint, { method: 'POST', headers: { 'content-type': contentType }, body }), env)
  expect(response.status).toBe(400)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(await response.json()).toEqual({ error })
})

it.each(['form', 'json'])('exchanges a %s authorization code once and rejects a wrong PKCE verifier', async (format) => {
  const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url')
  let consumed = false
  const database = vi.fn(async (_url: unknown, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      consumed = true
      return Response.json({ id: 'code-row' })
    }
    return Response.json({ id: 'code-row', client_id: fields.client_id, user_id: 'user-test', redirect_uri: fields.redirect_uri,
      code_challenge: challenge, scope: 'mcp:read', resource: 'https://setupvencedor.com.br/api/mcp',
      expires_at: new Date(Date.now() + 60_000).toISOString(), consumed_at: consumed ? new Date().toISOString() : null })
  })
  vi.stubGlobal('fetch', database)
  const exchange = (codeVerifier: string) => worker.fetch(new Request(endpoint, { method: 'POST', headers: {
    'content-type': format === 'form' ? 'application/x-www-form-urlencoded; charset=UTF-8' : 'application/json',
  }, body: format === 'form' ? new URLSearchParams({ ...fields, code_verifier: codeVerifier }).toString() : JSON.stringify({ ...fields, code_verifier: codeVerifier }) }), env)
  expect(await (await exchange('b'.repeat(43))).json()).toEqual({ error: 'invalid_grant' })
  expect(consumed).toBe(false)
  const response = await exchange(verifier)
  expect(response.status).toBe(200)
  const token = await response.json() as { access_token: string }
  await expect(validateMcpAccessToken(token.access_token, env)).resolves.toMatchObject({ userId: 'user-test', clientId: fields.client_id })
  expect(await (await exchange(verifier)).json()).toEqual({ error: 'invalid_grant' })
})

it.each([
  ['https://setupvencedor.com.br', 'https://www.setupvencedor.com.br'],
  ['https://staging.setupvencedor.com.br', 'https://staging.setupvencedor.com.br'],
])('opens consent on the logged-in frontend for %s', async (origin, expected) => {
  const query = new URLSearchParams({ response_type: 'code', client_id: fields.client_id, redirect_uri: fields.redirect_uri, code_challenge: verifier, code_challenge_method: 'S256', state: 'opaque-state' })
  const response = await worker.fetch(new Request(`${origin}/api/oauth/authorize?${query}`), { ...env, MCP_PUBLIC_ORIGIN: origin })
  const location = new URL(response.headers.get('location')!)
  expect(location.origin).toBe(expected)
  expect(location.pathname).toBe('/mcp/autorizar')
  expect(location.searchParams.toString()).toBe(query.toString())
})

it('accepts the authenticated MCP initialized notification without a JSON-RPC response', async () => {
  const token = await createMcpAccessToken({ userId: 'user-test', clientId: fields.client_id, scopes: ['mcp:read'] }, env)
  const response = await worker.fetch(new Request('https://setupvencedor.com.br/api/mcp', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }), env)
  expect(response.status).toBe(202)
  expect(await response.text()).toBe('')
})
