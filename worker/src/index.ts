import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './env'
import { createInviteToken, normalizeEmail, sha256, validateInviteInput, type InviteInput } from './invitations'
import { mcpResponse } from './mcp'
import { AssistantError, handleAssistantRequest } from './assistant'
import { parsePeoplePagination, type PeoplePagination } from './admin-people'
import { createMcpAccessToken, hashSecret, oauthMetadata, protectedResourceMetadata, publicOrigin, verifyPkce } from './oauth'

type ActivateInput = { token: string; password: string; email?: string; recipientName?: string }
type AdminContext = { supabase: SupabaseClient; userId: string }
type InvitationRow = {
  id: string; delivery: 'email' | 'direct_link'; email_normalized: string | null; recipient_name: string | null
  job_title: string | null; roles: string[]; state: 'pending' | 'claimed' | 'accepted' | 'revoked' | 'expired'; expires_at: string; created_at: string
}

const allowedOrigins = new Set([
  'https://setup-vencedor.pages.dev',
  'https://handdrawn-lab.setup-vencedor.pages.dev',
  'https://setup-vencedor-staging.pages.dev',
  'https://staging.setupvencedor.com.br',
  'https://setupvencedor.com.br',
  'https://www.setupvencedor.com.br',
])
const inviteExpiryMs = 72 * 60 * 60 * 1000

function corsHeaders(origin: string | null): HeadersInit {
  return {
    ...(origin && allowedOrigins.has(origin) ? { 'access-control-allow-origin': origin } : {}),
    'access-control-allow-headers': 'authorization,content-type',
    vary: 'Origin',
  }
}

function oauthError(error: string, request: Request, redirectUri?: string, state?: string): Response {
  if (redirectUri) {
    const target = new URL(redirectUri)
    target.searchParams.set('error', error)
    if (state) target.searchParams.set('state', state)
    return Response.redirect(target.toString(), 302)
  }
  return json({ error }, request, { status: 400 })
}

function validRedirectUri(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))
  } catch { return false }
}

async function registerMcpClient(request: Request, env: Env): Promise<Response> {
  const input = await readJson<{ client_name?: string; redirect_uris?: string[] }>(request)
  if (!input.client_name?.trim() || !Array.isArray(input.redirect_uris) || input.redirect_uris.length === 0 || !input.redirect_uris.every(validRedirectUri)) return json({ error: 'invalid_client_metadata' }, request, { status: 400 })
  const clientId = `setup_${crypto.randomUUID().replaceAll('-', '')}`
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await supabase.from('mcp_oauth_clients').insert({ client_id: clientId, client_name: input.client_name.trim().slice(0, 120), redirect_uris: [...new Set(input.redirect_uris)] })
  if (error) return json({ error: 'client_registration_unavailable' }, request, { status: 503 })
  return json({ client_id: clientId, client_name: input.client_name.trim().slice(0, 120), redirect_uris: input.redirect_uris, token_endpoint_auth_method: 'none' }, request, { status: 201 })
}

async function approveMcpAuthorization(request: Request, env: Env): Promise<Response> {
  const token = tokenFrom(request)
  if (!token) return json({ error: 'unauthorized' }, request, { status: 401 })
  const input = await readJson<{ client_id?: string; redirect_uri?: string; code_challenge?: string; state?: string; approved?: boolean }>(request)
  if (!input.client_id || !input.redirect_uri || !input.code_challenge || !validRedirectUri(input.redirect_uri)) return json({ error: 'invalid_authorization_request' }, request, { status: 400 })
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: userResult } = await supabase.auth.getUser(token)
  if (!userResult.user) return json({ error: 'unauthorized' }, request, { status: 401 })
  const [{ data: profile }, { data: client }] = await Promise.all([
    supabase.from('profiles').select('state').eq('id', userResult.user.id).eq('state', 'active').maybeSingle(),
    supabase.from('mcp_oauth_clients').select('client_id,redirect_uris').eq('client_id', input.client_id).is('disabled_at', null).maybeSingle(),
  ])
  if (!profile) return json({ error: 'forbidden' }, request, { status: 403 })
  if (!client || !(client.redirect_uris as string[]).includes(input.redirect_uri)) return json({ error: 'invalid_authorization_request' }, request, { status: 400 })
  if (!input.approved) return oauthError('access_denied', request, input.redirect_uri, input.state)
  const code = [...crypto.getRandomValues(new Uint8Array(32))].map((value) => value.toString(16).padStart(2, '0')).join('')
  const { error } = await supabase.from('mcp_authorization_codes').insert({ code_hash: await hashSecret(code), client_id: input.client_id, user_id: userResult.user.id, redirect_uri: input.redirect_uri, code_challenge: input.code_challenge, scope: 'mcp:read', resource: `${publicOrigin(env)}/api/mcp`, expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
  if (error) return json({ error: 'authorization_unavailable' }, request, { status: 503 })
  const redirect = new URL(input.redirect_uri)
  redirect.searchParams.set('code', code)
  if (input.state) redirect.searchParams.set('state', input.state)
  return json({ redirect_uri: redirect.toString() }, request)
}

async function exchangeMcpToken(request: Request, env: Env): Promise<Response> {
  const input = await readJson<{ grant_type?: string; code?: string; redirect_uri?: string; client_id?: string; code_verifier?: string }>(request)
  if (input.grant_type !== 'authorization_code' || !input.code || !input.client_id || !input.redirect_uri || !input.code_verifier) return json({ error: 'invalid_request' }, request, { status: 400 })
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: row } = await supabase.from('mcp_authorization_codes').select('id,client_id,user_id,redirect_uri,code_challenge,scope,resource,expires_at,consumed_at').eq('code_hash', await hashSecret(input.code)).maybeSingle()
  if (!row || row.client_id !== input.client_id || row.redirect_uri !== input.redirect_uri || row.consumed_at || new Date(row.expires_at).getTime() <= Date.now() || !await verifyPkce(input.code_verifier, row.code_challenge)) return json({ error: 'invalid_grant' }, request, { status: 400 })
  const { data: consumed } = await supabase.from('mcp_authorization_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id).is('consumed_at', null).select('id').maybeSingle()
  if (!consumed) return json({ error: 'invalid_grant' }, request, { status: 400 })
  const accessToken = await createMcpAccessToken({ userId: row.user_id, clientId: row.client_id, scopes: row.scope.split(' '), resource: row.resource }, env)
  return json({ access_token: accessToken, token_type: 'Bearer', expires_in: Number(env.MCP_ACCESS_TOKEN_TTL_SECONDS ?? 900), scope: row.scope, resource: row.resource }, request)
}

function json(data: unknown, request: Request, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: {
      'cache-control': 'no-store',
      ...corsHeaders(request.headers.get('origin')),
      ...(init.headers ?? {}),
    },
  })
}

function tokenFrom(request: Request): string | null {
  const value = request.headers.get('authorization')
  return value?.startsWith('Bearer ') ? value.slice(7) : null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}

function activationUrl(env: Env, token: string): string | undefined {
  return env.APP_URL ? `${env.APP_URL.replace(/\/$/, '')}/ativar?token=${encodeURIComponent(token)}` : undefined
}

function validPassword(password: string): boolean {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

async function requireAdmin(request: Request, env: Env): Promise<AdminContext> {
  const token = tokenFrom(request)
  if (!token) throw new Error('unauthorized')
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('unauthorized')
  const { data: role, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).eq('role', 'admin').maybeSingle()
  if (roleError || !role) throw new Error('forbidden')
  return { supabase, userId: data.user.id }
}

async function sendInviteEmail(env: Env, recipient: Pick<InvitationRow, 'email_normalized' | 'recipient_name'>, token: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.APP_URL || !recipient.email_normalized) return false
  const url = activationUrl(env, token)
  const greeting = recipient.recipient_name ? `Olá, ${escapeHtml(recipient.recipient_name)}.` : 'Olá.'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: recipient.email_normalized,
      subject: 'Seu acesso ao Setup Vencedor',
      html: `<main style="background:#080b12;color:#f4f7ff;padding:40px;font-family:Arial,sans-serif"><p style="color:#a8ff33;letter-spacing:.12em;font-size:12px">SETUP VENCEDOR</p><h1 style="font-size:30px">Seu acesso está pronto.</h1><p>${greeting} Defina sua senha para entrar na biblioteca privada da equipe.</p><p><a href="${url}" style="display:inline-block;background:#a8ff33;color:#07100a;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700">Criar meu acesso</a></p><p style="color:#aeb8cb;font-size:13px">Este link expira em 72 horas e só pode ser usado pelo e-mail ${escapeHtml(recipient.email_normalized)}.</p></main>`,
    }),
  })
  return response.ok
}

async function createInvitation(context: AdminContext, env: Env, input: ReturnType<typeof validateInviteInput>) {
  const token = createInviteToken()
  const row = {
    delivery: input.delivery,
    email_normalized: input.delivery === 'email' ? input.email ?? null : null,
    recipient_name: input.recipientName ?? null,
    job_title: input.jobTitle ?? null,
    roles: input.roles,
    token_hash: await sha256(token),
    expires_at: new Date(Date.now() + inviteExpiryMs).toISOString(),
    created_by: context.userId,
  }
  const { data, error } = await context.supabase.from('invitations').insert(row).select('id,delivery,email_normalized,recipient_name,job_title,roles,state,expires_at,created_at').single()
  if (error || !data) throw new Error('invitation_not_created')
  const invitation = data as InvitationRow
  const emailDelivered = invitation.delivery === 'email' ? await sendInviteEmail(env, invitation, token) : false
  await context.supabase.from('audit_events').insert({ actor_id: context.userId, invitation_id: invitation.id, event_type: 'invitation.created', payload: { delivery: invitation.delivery, roles: invitation.roles } })
  return { invitation, emailDelivered, activationUrl: invitation.delivery === 'direct_link' ? activationUrl(env, token) : undefined }
}

async function getInviteByToken(token: string, env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data } = await supabase.from('invitations').select('id,delivery,email_normalized,recipient_name,job_title,roles,state,expires_at,created_at').eq('token_hash', await sha256(token)).eq('state', 'pending').gt('expires_at', new Date().toISOString()).maybeSingle()
  return data as InvitationRow | null
}

async function readJson<T>(request: Request): Promise<T> {
  return await request.json() as T
}

async function revokeInvitation(context: AdminContext, invitationId: string, reason: string) {
  const { data, error } = await context.supabase.from('invitations').update({ state: 'revoked', revoked_at: new Date().toISOString(), revoked_by: context.userId }).eq('id', invitationId).in('state', ['pending', 'claimed']).select('id').maybeSingle()
  if (error || !data) throw new Error('invitation_not_available')
  await context.supabase.from('audit_events').insert({ actor_id: context.userId, invitation_id: invitationId, event_type: reason, payload: {} })
}

async function listPeople(context: AdminContext, query: string, pagination: PeoplePagination) {
  const normalized = query.trim().slice(0, 120)
  const searchTerm = normalized.replaceAll('%', '\\%').replaceAll('_', '\\_')
  const from = (pagination.page - 1) * pagination.pageSize
  const to = from + pagination.pageSize - 1
  let profilesQuery = context.supabase.from('profiles').select('id,email_normalized,full_name,phone,job_title,state,created_at,disabled_at,last_seen_at', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
  let invitationsQuery = context.supabase.from('invitations').select('id,delivery,email_normalized,recipient_name,job_title,roles,state,expires_at,created_at', { count: 'exact' }).in('state', ['pending', 'claimed']).order('created_at', { ascending: false }).range(from, to)
  if (normalized) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${searchTerm}%,email_normalized.ilike.%${searchTerm}%`)
    invitationsQuery = invitationsQuery.or(`recipient_name.ilike.%${searchTerm}%,email_normalized.ilike.%${searchTerm}%`)
  }
  const [{ data: profiles, error: profilesError, count: peopleTotal }, { data: invitations, error: invitationsError, count: invitationsTotal }] = await Promise.all([
    profilesQuery,
    invitationsQuery,
  ])
  if (profilesError || invitationsError) throw new Error('people_not_available')
  const ids = (profiles ?? []).map((profile) => profile.id)
  const { data: roles, error: rolesError } = ids.length ? await context.supabase.from('user_roles').select('user_id,role').in('user_id', ids) : { data: [], error: null }
  if (rolesError) throw new Error('people_not_available')
  return {
    people: (profiles ?? []).map((profile) => ({ ...profile, roles: (roles ?? []).filter((role) => role.user_id === profile.id).map((role) => role.role) })),
    invitations: invitations ?? [],
    peopleTotal: peopleTotal ?? 0,
    invitationsTotal: invitationsTotal ?? 0,
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
}

function routeId(path: string, pattern: RegExp): string | null {
  return path.match(pattern)?.[1] ?? null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...corsHeaders(request.headers.get('origin')), 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS' } })
    const path = new URL(request.url).pathname
    if (path === '/health' || path === '/api/health') return json({ ok: true }, request)
    if (request.method === 'GET' && path === '/.well-known/oauth-protected-resource') return json(protectedResourceMetadata(env), request)
    if (request.method === 'GET' && path === '/.well-known/oauth-authorization-server') return json(oauthMetadata(env), request)
    if (request.method === 'POST' && path === '/api/oauth/register') return registerMcpClient(request, env)
    if (request.method === 'POST' && path === '/api/oauth/consent') return approveMcpAuthorization(request, env)
    if (request.method === 'POST' && path === '/api/oauth/token') return exchangeMcpToken(request, env)
    if (request.method === 'GET' && path === '/api/oauth/authorize') {
      const url = new URL(request.url)
      const clientId = url.searchParams.get('client_id')
      const redirectUri = url.searchParams.get('redirect_uri')
      const codeChallenge = url.searchParams.get('code_challenge')
      if (url.searchParams.get('response_type') !== 'code' || !clientId || !redirectUri || !codeChallenge || !validRedirectUri(redirectUri)) return oauthError('invalid_request', request)
      const approval = new URL(`${publicOrigin(env)}/mcp/autorizar`)
      approval.search = url.search
      return Response.redirect(approval.toString(), 302)
    }
    if ((request.method === 'POST' || request.method === 'GET') && path === '/api/mcp') return mcpResponse(request, env)
    if (path === '/mcp') return Response.redirect(`${publicOrigin(env)}/api/mcp`, 308)

    if (request.method === 'POST' && path === '/v1/assistant/recommendations') {
      try {
        const response = await handleAssistantRequest(request, env)
        return json(response.body, request, { status: response.status })
      } catch (error) {
        if (error instanceof AssistantError) return json({ error: error.code }, request, { status: error.status })
        return json({ error: 'assistant_not_available' }, request, { status: 503 })
      }
    }

    if (request.method === 'POST' && path === '/v1/invitations') {
      try {
        const context = await requireAdmin(request, env)
        const created = await createInvitation(context, env, validateInviteInput(await readJson<InviteInput>(request)))
        return json({ ok: true, emailDelivered: created.emailDelivered, activationUrl: created.activationUrl }, request, { status: 201 })
      } catch (error) {
        const code = error instanceof Error ? error.message : 'internal_error'
        return json({ error: code }, request, { status: code === 'unauthorized' ? 401 : code === 'forbidden' ? 403 : code === 'invalid_invitation' || code === 'invalid_email' ? 400 : 409 })
      }
    }

    if (request.method === 'POST' && path === '/v1/invitations/validate') {
      const input = await readJson<{ token?: string }>(request)
      if (!input.token) return json({ error: 'invalid_invitation' }, request, { status: 400 })
      const invitation = await getInviteByToken(input.token, env)
      if (!invitation) return json({ error: 'invalid_or_expired_invitation' }, request, { status: 404 })
      return json({ delivery: invitation.delivery, email: invitation.email_normalized, recipientName: invitation.recipient_name }, request)
    }

    if (request.method === 'POST' && path === '/v1/invitations/activate') {
      try {
        const input = await readJson<ActivateInput>(request)
        if (!input.token || !validPassword(input.password)) return json({ error: 'invalid_activation' }, request, { status: 400 })
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        const activationEmail = input.email ? normalizeEmail(input.email) : null
        const { data: claimed, error: claimError } = await supabase.rpc('claim_invitation', { invitation_token_hash: await sha256(input.token), activation_email: activationEmail, activation_recipient_name: input.recipientName?.trim() || null })
        const invitation = Array.isArray(claimed) ? claimed[0] : null
        if (claimError || !invitation) return json({ error: 'invalid_or_expired_invitation' }, request, { status: 409 })
        const { data: created, error: createError } = await supabase.auth.admin.createUser({ email: invitation.email_normalized, password: input.password, email_confirm: true, user_metadata: { full_name: invitation.recipient_name } })
        if (createError || !created.user) {
          await supabase.from('invitations').update({ state: 'pending', claimed_at: null }).eq('id', invitation.id).eq('state', 'claimed')
          return json({ error: 'activation_not_completed' }, request, { status: 409 })
        }
        const userId = created.user.id
        const now = new Date().toISOString()
        const { error: profileError } = await supabase.from('profiles').upsert({ id: userId, email_normalized: invitation.email_normalized, full_name: invitation.recipient_name, job_title: invitation.job_title, state: 'active', activated_at: now }, { onConflict: 'id' })
        if (profileError) throw new Error('profile_not_created')
        const { error: roleError } = await supabase.from('user_roles').upsert((invitation.roles as string[]).map((role) => ({ user_id: userId, role })), { onConflict: 'user_id,role', ignoreDuplicates: true })
        if (roleError) throw new Error('roles_not_created')
        const { error: acceptanceError } = await supabase.from('invitations').update({ state: 'accepted', claimed_at: null, accepted_at: now, accepted_by: userId }).eq('id', invitation.id).eq('state', 'claimed')
        if (acceptanceError) throw new Error('invitation_not_accepted')
        await supabase.from('audit_events').insert({ actor_id: userId, target_user_id: userId, invitation_id: invitation.id, event_type: 'invitation.accepted' })
        return json({ ok: true }, request, { status: 201 })
      } catch (error) {
        const code = error instanceof Error ? error.message : 'activation_not_completed'
        return json({ error: code === 'invalid_email' ? 'invalid_activation' : 'activation_not_completed' }, request, { status: 500 })
      }
    }

    try {
      const context = await requireAdmin(request, env)
      if (request.method === 'GET' && path === '/v1/admin/people') {
        const url = new URL(request.url)
        return json(await listPeople(context, url.searchParams.get('query') ?? '', parsePeoplePagination(url.searchParams)), request)
      }

      const resendId = routeId(path, /^\/v1\/admin\/invitations\/([^/]+)\/resend$/)
      if (request.method === 'POST' && resendId) {
        const { data } = await context.supabase.from('invitations').select('id,delivery,email_normalized,recipient_name,job_title,roles,state,expires_at,created_at').eq('id', resendId).eq('delivery', 'email').eq('state', 'pending').maybeSingle()
        if (!data) throw new Error('invitation_not_available')
        await revokeInvitation(context, resendId, 'invitation.replaced')
        const created = await createInvitation(context, env, validateInviteInput({ delivery: 'email', email: data.email_normalized ?? undefined, recipientName: data.recipient_name ?? undefined, jobTitle: data.job_title ?? undefined, roles: data.roles }))
        return json({ ok: true, emailDelivered: created.emailDelivered }, request)
      }

      const regenerateId = routeId(path, /^\/v1\/admin\/invitations\/([^/]+)\/regenerate$/)
      if (request.method === 'POST' && regenerateId) {
        const { data } = await context.supabase.from('invitations').select('id,delivery,email_normalized,recipient_name,job_title,roles,state,expires_at,created_at').eq('id', regenerateId).eq('delivery', 'direct_link').eq('state', 'pending').maybeSingle()
        if (!data) throw new Error('invitation_not_available')
        await revokeInvitation(context, regenerateId, 'invitation.replaced')
        const created = await createInvitation(context, env, validateInviteInput({ delivery: 'direct_link', recipientName: data.recipient_name ?? undefined, jobTitle: data.job_title ?? undefined, roles: data.roles }))
        return json({ ok: true, activationUrl: created.activationUrl }, request)
      }

      const revokeId = routeId(path, /^\/v1\/admin\/invitations\/([^/]+)\/revoke$/)
      if (request.method === 'POST' && revokeId) {
        await revokeInvitation(context, revokeId, 'invitation.revoked')
        return json({ ok: true }, request)
      }

      const accessUserId = routeId(path, /^\/v1\/admin\/people\/([^/]+)\/access$/)
      if (request.method === 'POST' && accessUserId) {
        const input = await readJson<{ state?: 'active' | 'disabled' }>(request)
        if (input.state !== 'active' && input.state !== 'disabled') throw new Error('invalid_access_state')
        if (accessUserId === context.userId) throw new Error('cannot_change_own_access')
        if (input.state === 'disabled') await context.supabase.auth.admin.signOut(accessUserId, 'global')
        const { error } = await context.supabase.from('profiles').update({ state: input.state, disabled_at: input.state === 'disabled' ? new Date().toISOString() : null, activated_at: input.state === 'active' ? new Date().toISOString() : null }).eq('id', accessUserId)
        if (error) throw new Error('access_not_updated')
        await context.supabase.from('audit_events').insert({ actor_id: context.userId, target_user_id: accessUserId, event_type: input.state === 'disabled' ? 'profile.disabled' : 'profile.activated' })
        return json({ ok: true }, request)
      }

      const deleteUserId = routeId(path, /^\/v1\/admin\/people\/([^/]+)$/)
      if (request.method === 'DELETE' && deleteUserId) {
        if (deleteUserId === context.userId) throw new Error('cannot_delete_own_account')
        await context.supabase.auth.admin.signOut(deleteUserId, 'global')
        await context.supabase.from('audit_events').insert({ actor_id: context.userId, target_user_id: deleteUserId, event_type: 'profile.deleted' })
        const { error } = await context.supabase.auth.admin.deleteUser(deleteUserId, false)
        if (error) throw new Error('person_not_deleted')
        return json({ ok: true }, request)
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : 'internal_error'
      return json({ error: code }, request, { status: code === 'unauthorized' ? 401 : code === 'forbidden' ? 403 : code.startsWith('invalid_') || code.startsWith('cannot_') ? 400 : 409 })
    }
    return json({ error: 'not_found' }, request, { status: 404 })
  },
} satisfies ExportedHandler<Env>
