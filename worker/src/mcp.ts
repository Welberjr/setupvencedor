import { createClient } from '@supabase/supabase-js'
import type { Env } from './env'

const tools = [
  { name: 'search_catalog', description: 'Busca itens publicados no acervo da equipe.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_catalog_item', description: 'Obtém os detalhes de um item publicado usando o slug.', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
]

export async function mcpResponse(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: userResult } = await supabase.auth.getUser(auth.slice(7))
  if (!userResult.user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('state').eq('id', userResult.user.id).eq('state', 'active').maybeSingle()
  if (!profile) return Response.json({ error: 'forbidden' }, { status: 403 })
  const message = (await request.json()) as { id?: string | number; method?: string; params?: Record<string, unknown> }
  if (message.method === 'initialize') return Response.json({ jsonrpc: '2.0', id: message.id ?? null, result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'setup-vencedor', version: '0.1.0' } } })
  if (message.method === 'tools/list') return Response.json({ jsonrpc: '2.0', id: message.id ?? null, result: { tools } })
  if (message.method !== 'tools/call') return Response.json({ jsonrpc: '2.0', id: message.id ?? null, error: { code: -32601, message: 'method_not_found' } })
  const name = message.params?.name
  const arguments_ = (message.params?.arguments ?? {}) as Record<string, string>
  if (name === 'search_catalog') {
    const query = arguments_.query?.trim() ?? ''
    const { data, error } = await supabase.from('catalog_items').select('slug,title,summary,official_url,instructions,item_type').eq('status', 'published').eq('visibility', 'team').textSearch('search_document', query, { type: 'websearch', config: 'portuguese' }).limit(10)
    if (error) return Response.json({ jsonrpc: '2.0', id: message.id ?? null, error: { code: -32000, message: 'catalog_unavailable' } })
    return Response.json({ jsonrpc: '2.0', id: message.id ?? null, result: { content: [{ type: 'text', text: JSON.stringify(data) }] } })
  }
  if (name === 'get_catalog_item') {
    const { data, error } = await supabase.from('catalog_items').select('slug,title,summary,own_content,official_url,instructions,item_type').eq('slug', arguments_.slug ?? '').eq('status', 'published').eq('visibility', 'team').maybeSingle()
    if (error || !data) return Response.json({ jsonrpc: '2.0', id: message.id ?? null, error: { code: -32004, message: 'item_not_found' } })
    return Response.json({ jsonrpc: '2.0', id: message.id ?? null, result: { content: [{ type: 'text', text: JSON.stringify(data) }] } })
  }
  return Response.json({ jsonrpc: '2.0', id: message.id ?? null, error: { code: -32602, message: 'tool_not_found' } })
}
