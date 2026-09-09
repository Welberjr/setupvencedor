import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './env'
import { createMcpAccessToken, hashSecret, publicOrigin } from './oauth'

type Grant = { user_id: string; client_id: string; scope: string; resource: string }
const lifetimeMs = 30 * 24 * 60 * 60 * 1000

export async function activeMcpGrant(db: SupabaseClient, grant: Grant, requireConsent = true): Promise<boolean> {
  const [{ data: profile, error: profileError }, { data: client, error: clientError }] = await Promise.all([
    db.from('profiles').select('id').eq('id', grant.user_id).eq('state', 'active').maybeSingle(),
    db.from('mcp_oauth_clients').select('client_id').eq('client_id', grant.client_id).is('disabled_at', null).maybeSingle(),
  ])
  if (profileError || clientError || !profile || !client) return false
  if (!requireConsent) return true
  const { data: consent, error } = await db.from('mcp_consents').select('id,scope').eq('client_id', grant.client_id).eq('user_id', grant.user_id).eq('resource', grant.resource).is('revoked_at', null).maybeSingle()
  return !error && !!consent && grant.scope.split(' ').every(scope => consent.scope.split(' ').includes(scope))
}

export async function issueMcpTokens(db: SupabaseClient, grant: Grant, env: Env, expiresAt = new Date(Date.now() + lifetimeMs).toISOString()) {
  const refreshToken = [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, '0')).join('')
  const { error } = await db.from('mcp_refresh_tokens').insert({ ...grant, token_hash: await hashSecret(refreshToken), expires_at: expiresAt })
  if (error) throw new Error('token_unavailable')
  const accessToken = await createMcpAccessToken({ userId: grant.user_id, clientId: grant.client_id, scopes: grant.scope.split(' '), resource: grant.resource }, env)
  return { access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: Math.max(300, Number(env.MCP_ACCESS_TOKEN_TTL_SECONDS ?? 900)), scope: grant.scope, resource: grant.resource }
}

export async function refreshMcpTokens(db: SupabaseClient, input: { refresh_token?: string; client_id?: string; scope?: string; resource?: string }, env: Env) {
  if (!input.refresh_token || !input.client_id) throw new Error('invalid_request')
  const { data: row, error } = await db.from('mcp_refresh_tokens').select('id,user_id,client_id,scope,resource,expires_at,rotated_at,revoked_at').eq('token_hash', await hashSecret(input.refresh_token)).maybeSingle()
  if (error) throw new Error('token_unavailable')
  if (!row || row.client_id !== input.client_id || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now() || row.resource !== `${publicOrigin(env)}/api/mcp`) throw new Error('invalid_grant')
  if (input.resource && input.resource !== row.resource) throw new Error('invalid_target')
  if (input.scope && input.scope !== row.scope) throw new Error('invalid_scope')
  if (row.rotated_at) {
    // Reuse invalidates the authorization family; a fresh interactive consent is required.
    const revokedAt = new Date().toISOString()
    await db.from('mcp_consents').update({ revoked_at: revokedAt }).eq('client_id', row.client_id).eq('user_id', row.user_id).eq('resource', row.resource)
    await db.from('mcp_refresh_tokens').update({ revoked_at: revokedAt }).eq('client_id', row.client_id).eq('user_id', row.user_id).eq('resource', row.resource).is('revoked_at', null)
    throw new Error('invalid_grant')
  }
  if (!await activeMcpGrant(db, row)) throw new Error('invalid_grant')
  const { data: claimed, error: claimError } = await db.from('mcp_refresh_tokens').update({ rotated_at: new Date().toISOString() }).eq('id', row.id).is('rotated_at', null).is('revoked_at', null).select('id').maybeSingle()
  if (claimError) throw new Error('token_unavailable')
  if (!claimed) throw new Error('invalid_grant')
  // Keep the original absolute expiry rather than extending a stolen session forever.
  return issueMcpTokens(db, { user_id: row.user_id, client_id: row.client_id, scope: row.scope, resource: row.resource }, env, row.expires_at)
}
