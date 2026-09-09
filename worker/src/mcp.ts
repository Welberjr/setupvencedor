import { createClient } from '@supabase/supabase-js'
import type { Env } from './env'
import { protectedResourceMetadata, validateMcpAccessToken } from './oauth'
import { activeMcpGrant } from './mcp-refresh'

type JsonRpc = { id?: string | number | null; method?: string; params?: Record<string, unknown>; jsonrpc?: string }

export const mcpToolDefinitions = [
  { name: 'search_resources', description: 'Busca recursos publicados no acervo da equipe.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, annotations: { readOnlyHint: true } },
  { name: 'get_resource', description: 'Obtém detalhes de um recurso pelo slug.', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] }, annotations: { readOnlyHint: true } },
  { name: 'list_by_kind', description: 'Lista recursos publicados por tipo.', inputSchema: { type: 'object', properties: { kind: { type: 'string' } }, required: ['kind'] }, annotations: { readOnlyHint: true } },
  { name: 'recommend_for_project', description: 'Indica recursos do acervo para um objetivo técnico.', inputSchema: { type: 'object', properties: { project: { type: 'string' } }, required: ['project'] }, annotations: { readOnlyHint: true } },
] as const

function unauthorized(env: Env): Response {
  return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'www-authenticate': `Bearer resource_metadata="${(env.MCP_PUBLIC_ORIGIN ?? 'https://setupvencedor.com.br').replace(/\/$/, '')}/.well-known/oauth-protected-resource"` } })
}

function jsonRpc(id: JsonRpc['id'], result?: unknown, error?: { code: number; message: string }): Response {
  return Response.json(error ? { jsonrpc: '2.0', id: id ?? null, error } : { jsonrpc: '2.0', id: id ?? null, result }, { headers: { 'cache-control': 'no-store' } })
}

function toolResult(id: JsonRpc['id'], data: unknown): Response {
  return jsonRpc(id, { content: [{ type: 'text', text: JSON.stringify(data) }] })
}

export async function mcpResponse(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return unauthorized(env)
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const grant = await validateMcpAccessToken(auth.slice(7), env)
    if (!await activeMcpGrant(supabase, { user_id: grant.userId, client_id: grant.clientId, scope: grant.scopes.join(' '), resource: protectedResourceMetadata(env).resource })) return unauthorized(env)
  } catch { return unauthorized(env) }
  if (request.method === 'GET') return new Response(null, { status: 405, headers: { allow: 'POST' } })
  let message: JsonRpc
  try { message = await request.json() as JsonRpc } catch { return jsonRpc(null, undefined, { code: -32700, message: 'parse_error' }) }
  if (message.jsonrpc !== '2.0' || !message.method) return jsonRpc(message.id, undefined, { code: -32600, message: 'invalid_request' })
  if (message.id === undefined && message.method.startsWith('notifications/')) return new Response(null, { status: 202 })
  if (message.method === 'initialize') return jsonRpc(message.id, { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'setup-agent', version: '1.0.0' } })
  if (message.method === 'tools/list') return jsonRpc(message.id, { tools: mcpToolDefinitions })
  if (message.method !== 'tools/call') return jsonRpc(message.id, undefined, { code: -32601, message: 'method_not_found' })
  const params = message.params ?? {}
  const name = params.name
  const arguments_ = (message.params?.arguments ?? {}) as Record<string, string>
  const select = 'slug,title,summary,own_content,official_url,instructions,item_type'
  if (name === 'search_resources' || name === 'recommend_for_project') {
    const query = (arguments_[name === 'search_resources' ? 'query' : 'project'] ?? '').trim()
    if (!query) return jsonRpc(message.id, undefined, { code: -32602, message: 'query_required' })
    const { data, error } = await supabase.from('catalog_items').select(select).eq('status', 'published').eq('visibility', 'team').textSearch('search_document', query, { type: 'websearch', config: 'portuguese' }).limit(10)
    if (error) return jsonRpc(message.id, undefined, { code: -32000, message: 'catalog_unavailable' })
    return toolResult(message.id, name === 'recommend_for_project' ? { project: query, resources: data } : data)
  }
  if (name === 'get_resource') {
    const { data, error } = await supabase.from('catalog_items').select(select).eq('slug', arguments_.slug ?? '').eq('status', 'published').eq('visibility', 'team').maybeSingle()
    if (error || !data) return jsonRpc(message.id, undefined, { code: -32004, message: 'resource_not_found' })
    return toolResult(message.id, data)
  }
  if (name === 'list_by_kind') {
    const kind = (arguments_.kind ?? '').trim()
    if (!kind) return jsonRpc(message.id, undefined, { code: -32602, message: 'kind_required' })
    const { data, error } = await supabase.from('catalog_items').select(select).eq('status', 'published').eq('visibility', 'team').eq('item_type', kind).limit(10)
    if (error) return jsonRpc(message.id, undefined, { code: -32000, message: 'catalog_unavailable' })
    return toolResult(message.id, data)
  }
  return jsonRpc(message.id, undefined, { code: -32602, message: 'tool_not_found' })
}

export { protectedResourceMetadata }
