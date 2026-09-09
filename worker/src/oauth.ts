type OAuthEnv = {
  MCP_OAUTH_SIGNING_KEY: string
  MCP_PUBLIC_ORIGIN?: string
  MCP_ACCESS_TOKEN_TTL_SECONDS?: string
}

type AccessClaims = { sub: string; client_id: string; scope: string; aud: string; exp: number; iat: number }

type TokenRequest = Partial<Record<'grant_type' | 'code' | 'redirect_uri' | 'client_id' | 'code_verifier' | 'refresh_token' | 'resource' | 'scope', string>>

export async function readTokenRequest(request: Request): Promise<TokenRequest> {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  let value: unknown
  if (contentType === 'application/x-www-form-urlencoded') {
    const form = new URLSearchParams(await request.text())
    for (const key of form.keys()) {
      if (form.getAll(key).length !== 1) throw new Error('invalid_request')
    }
    value = Object.fromEntries(form)
  } else if (contentType === 'application/json') {
    value = await request.json()
  } else {
    throw new Error('invalid_request')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_request')
  const result: TokenRequest = {}
  for (const key of ['grant_type', 'code', 'redirect_uri', 'client_id', 'code_verifier', 'refresh_token', 'resource', 'scope'] as const) {
    const field = (value as Record<string, unknown>)[key]
    if (field !== undefined && typeof field !== 'string') throw new Error('invalid_request')
    result[key] = field
  }
  return result
}

export function authorizationUiOrigin(env: OAuthEnv): string {
  const origin = publicOrigin(env)
  // The production browser session lives on www; keep the API issuer and audience unchanged.
  return origin === 'https://setupvencedor.com.br' ? 'https://www.setupvencedor.com.br' : origin
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return mismatch === 0
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))))
}

export async function hashSecret(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyPkce(verifier: string, challenge: string): Promise<boolean> {
  if (verifier.length < 43 || verifier.length > 128 || challenge.length < 43 || challenge.length > 128) return false
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return timingSafeEqual(base64Url(new Uint8Array(digest)), challenge)
}

export function publicOrigin(env: OAuthEnv): string {
  return (env.MCP_PUBLIC_ORIGIN ?? 'https://setupvencedor.com.br').replace(/\/$/, '')
}

export function oauthMetadata(env: OAuthEnv) {
  const issuer = publicOrigin(env)
  return { issuer, authorization_endpoint: `${issuer}/api/oauth/authorize`, token_endpoint: `${issuer}/api/oauth/token`, registration_endpoint: `${issuer}/api/oauth/register`, response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'] }
}

export function protectedResourceMetadata(env: OAuthEnv) {
  return { resource: `${publicOrigin(env)}/api/mcp`, authorization_servers: [publicOrigin(env)], bearer_methods_supported: ['header'] }
}

export async function createMcpAccessToken(input: { userId: string; clientId: string; scopes: string[]; resource?: string }, env: OAuthEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const claims: AccessClaims = { sub: input.userId, client_id: input.clientId, scope: input.scopes.join(' '), aud: input.resource ?? `${publicOrigin(env)}/api/mcp`, iat: now, exp: now + Math.max(300, Number(env.MCP_ACCESS_TOKEN_TTL_SECONDS ?? 900)) }
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = base64Url(new TextEncoder().encode(JSON.stringify(claims)))
  return `${header}.${payload}.${await hmac(`${header}.${payload}`, env.MCP_OAUTH_SIGNING_KEY)}`
}

export async function validateMcpAccessToken(value: string, env: OAuthEnv): Promise<{ userId: string; clientId: string; scopes: string[] }> {
  const [header, payload, signature, ...rest] = value.split('.')
  if (!header || !payload || !signature || rest.length || !timingSafeEqual(signature, await hmac(`${header}.${payload}`, env.MCP_OAUTH_SIGNING_KEY))) throw new Error('invalid_token')
  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AccessClaims
    if (claims.aud !== `${publicOrigin(env)}/api/mcp` || claims.exp <= Math.floor(Date.now() / 1000) || !claims.sub || !claims.client_id || !claims.scope.split(' ').includes('mcp:read')) throw new Error('invalid_token')
    return { userId: claims.sub, clientId: claims.client_id, scopes: claims.scope.split(' ').filter(Boolean) }
  } catch {
    throw new Error('invalid_token')
  }
}
