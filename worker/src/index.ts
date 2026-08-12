import { createClient } from '@supabase/supabase-js'
import type { Env } from './env'
import { createInviteToken, normalizeEmail, sha256 } from './invitations'
import { mcpResponse } from './mcp'

type InviteInput = { email: string; recipientName: string; jobTitle?: string; roles: string[] }
type ActivateInput = { token: string; password: string }

function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', 'access-control-allow-origin': 'https://setup-vencedor.pages.dev', 'access-control-allow-headers': 'authorization,content-type', ...(init.headers ?? {}) } })
}

function tokenFrom(request: Request): string | null {
  const value = request.headers.get('authorization')
  return value?.startsWith('Bearer ') ? value.slice(7) : null
}

async function requireAdmin(request: Request, env: Env) {
  const token = tokenFrom(request)
  if (!token) throw new Error('unauthorized')
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('unauthorized')
  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle()
  if (roleError || !role) throw new Error('forbidden')
  return { supabase, userId: data.user.id }
}

async function sendInviteEmail(env: Env, recipient: InviteInput, token: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.APP_URL) return
  const url = `${env.APP_URL.replace(/\/$/, '')}/ativar?token=${encodeURIComponent(token)}`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: recipient.email,
      subject: 'Seu acesso ao Setup Vencedor',
      html: `<main style="background:#07090f;color:#f4f7ff;padding:40px;font-family:Arial,sans-serif"><p style="color:#93a1c6;letter-spacing:.12em">SETUP VENCEDOR</p><h1>Seu acesso está pronto.</h1><p>Olá, ${recipient.recipientName}. Crie sua senha para entrar na central de conhecimento da equipe.</p><p><a href="${url}" style="display:inline-block;background:#315cff;color:white;padding:14px 20px;border-radius:12px;text-decoration:none">Criar meu acesso</a></p><p style="color:#93a1c6">Este link expira em 72 horas e só funciona para ${recipient.email}.</p></main>`,
    }),
  })
  if (!response.ok) throw new Error('email_delivery_failed')
}

function validPassword(password: string): boolean {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

async function getInviteByToken(token: string, env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data } = await supabase.from('invitations').select('id,email_normalized,recipient_name,job_title,roles').eq('token_hash', await sha256(token)).eq('state', 'pending').gt('expires_at', new Date().toISOString()).maybeSingle()
  return data
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': 'https://setup-vencedor.pages.dev', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS' } })
    if (new URL(request.url).pathname === '/health') return Response.json({ ok: true })
    if (request.method === 'POST' && new URL(request.url).pathname === '/mcp') return mcpResponse(request, env)
    if (request.method === 'POST' && new URL(request.url).pathname === '/v1/invitations') {
      try {
        const { supabase, userId } = await requireAdmin(request, env)
        const input = (await request.json()) as InviteInput
        const email = normalizeEmail(input.email)
        if (!input.recipientName?.trim() || !Array.isArray(input.roles) || input.roles.length === 0) {
          return json({ error: 'invalid_invitation' }, { status: 400 })
        }
        const token = createInviteToken()
        const { error } = await supabase.from('invitations').insert({
          email_normalized: email,
          recipient_name: input.recipientName.trim(),
          job_title: input.jobTitle?.trim() || null,
          roles: input.roles,
          token_hash: await sha256(token),
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          created_by: userId,
        })
        if (error) return json({ error: 'invitation_not_created' }, { status: 409 })
        await sendInviteEmail(env, { ...input, email }, token)
        return json({ ok: true }, { status: 201 })
      } catch (error) {
        const code = error instanceof Error ? error.message : 'internal_error'
        return json({ error: code }, { status: code === 'unauthorized' ? 401 : code === 'forbidden' ? 403 : 500 })
      }
    }
    if (request.method === 'POST' && new URL(request.url).pathname === '/v1/invitations/validate') {
      const input = (await request.json()) as { token?: string }
      if (!input.token) return json({ error: 'invalid_invitation' }, { status: 400 })
      const invitation = await getInviteByToken(input.token, env)
      if (!invitation) return json({ error: 'invalid_or_expired_invitation' }, { status: 404 })
      return json({ email: invitation.email_normalized, recipientName: invitation.recipient_name })
    }
    if (request.method === 'POST' && new URL(request.url).pathname === '/v1/invitations/activate') {
      try {
        const input = (await request.json()) as ActivateInput
        if (!input.token || !validPassword(input.password)) return json({ error: 'invalid_activation' }, { status: 400 })
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        const hash = await sha256(input.token)
        const { data: claimed, error: claimError } = await supabase.rpc('claim_invitation', { invitation_token_hash: hash })
        const invitation = Array.isArray(claimed) ? claimed[0] : null
        if (claimError || !invitation) return json({ error: 'invalid_or_expired_invitation' }, { status: 409 })
        const { data: created, error: createError } = await supabase.auth.admin.createUser({ email: invitation.email_normalized, password: input.password, email_confirm: true, user_metadata: { full_name: invitation.recipient_name } })
        if (createError || !created.user) {
          await supabase.from('invitations').update({ state: 'pending', claimed_at: null }).eq('id', invitation.id).eq('state', 'claimed')
          return json({ error: 'activation_not_completed' }, { status: 409 })
        }
        const userId = created.user.id
        const now = new Date().toISOString()
        const { error: profileError } = await supabase.from('profiles').upsert({ id: userId, email_normalized: invitation.email_normalized, full_name: invitation.recipient_name, job_title: invitation.job_title, state: 'active', activated_at: now }, { onConflict: 'id' })
        if (profileError) throw new Error('profile_not_created')
        const roles = (invitation.roles as string[]).map((role) => ({ user_id: userId, role }))
        const { error: roleError } = await supabase.from('user_roles').upsert(roles, { onConflict: 'user_id,role', ignoreDuplicates: true })
        if (roleError) throw new Error('roles_not_created')
        const { error: acceptanceError } = await supabase.from('invitations').update({ state: 'accepted', accepted_at: now, accepted_by: userId }).eq('id', invitation.id).eq('state', 'claimed')
        if (acceptanceError) throw new Error('invitation_not_accepted')
        await supabase.from('audit_events').insert({ actor_id: userId, target_user_id: userId, invitation_id: invitation.id, event_type: 'invitation.accepted' })
        return json({ ok: true }, { status: 201 })
      } catch {
        return json({ error: 'activation_not_completed' }, { status: 500 })
      }
    }
    return Response.json({ error: 'not_found' }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
