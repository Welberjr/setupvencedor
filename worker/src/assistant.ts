import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './env'

const MAX_QUERY_LENGTH = 1500
const MAX_AUDIO_BYTES = 15 * 1024 * 1024
const MAX_AUDIO_SECONDS = 120
const MAX_REQUESTS_PER_WINDOW = 12
const WINDOW_MS = 10 * 60 * 1000

type AssistantCandidate = {
  id: string; slug: string; title: string; item_type: string; category: string; summary: string; own_content: string; official_url: string; instructions: string; relevance: number
}
type CatalogForIndex = {
  id: string; title: string; item_type: string; summary: string; own_content: string; instructions: string; categories: { name: string } | null
  catalog_item_topics: Array<{ topics: { name: string } | null }>; catalog_item_tags: Array<{ tags: { name: string } | null }>
}

export type AssistantRecommendation = { id: string; why: string; firstStep: string }
export type AssistantResult = {
  query: string; transcript?: string; mode: 'ai' | 'fallback'; summary: string; recommendations: AssistantRecommendation[]; resources: Array<Pick<AssistantCandidate, 'id' | 'slug' | 'title' | 'item_type' | 'category' | 'summary' | 'official_url' | 'instructions'>>
}
type AssistantGuidance = Pick<AssistantResult, 'mode' | 'summary' | 'recommendations'>
type AssistantResource = AssistantResult['resources'][number]

export class AssistantError extends Error {
  constructor(readonly code: string, readonly status: number) { super(code) }
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH) : ''
}

function isVisualObjective(query: string): boolean {
  const normalized = query.toLocaleLowerCase('pt-BR')
  return /\b(lp|landing|landing page|interface|frontend|design|visual|animação|animacao|3d)\b/.test(normalized)
}

export function enrichAssistantSearchQuery(query: string): string {
  return isVisualObjective(query) ? `${query} frontend design interface landing page` : query
}

function canonicalCandidateTitle(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim()
}

function candidateTitleQuality(title: string): number {
  return (/[A-ZÀ-Ý]/.test(title) ? 2 : 0) + (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(title) ? 0 : 1)
}

export function dedupeAssistantCandidates(candidates: AssistantCandidate[]): AssistantCandidate[] {
  const unique = new Map<string, AssistantCandidate>()
  for (const candidate of candidates) {
    const key = canonicalCandidateTitle(candidate.title)
    const existing = unique.get(key)
    if (!existing || candidateTitleQuality(candidate.title) > candidateTitleQuality(existing.title)) unique.set(key, candidate)
  }
  return [...unique.values()]
}

export function mergeAssistantCandidates(semantic: AssistantCandidate[], keyword: AssistantCandidate[]): AssistantCandidate[] {
  const candidatesById = new Map<string, AssistantCandidate>()
  for (const candidate of [...semantic, ...keyword]) {
    const existing = candidatesById.get(candidate.id)
    if (!existing || candidate.relevance > existing.relevance) candidatesById.set(candidate.id, candidate)
  }
  return dedupeAssistantCandidates([...candidatesById.values()]).sort((left, right) => right.relevance - left.relevance).slice(0, 20)
}

export function addVisualDesignComplement(query: string, guidance: AssistantGuidance, candidates: AssistantCandidate[]): AssistantGuidance {
  if (!isVisualObjective(query) || guidance.recommendations.length >= 4 || guidance.recommendations.some((item) => canonicalCandidateTitle(candidates.find((candidate) => candidate.id === item.id)?.title ?? '') === 'frontend design')) return guidance
  const frontendDesign = candidates.find((candidate) => canonicalCandidateTitle(candidate.title) === 'frontend design')
  if (!frontendDesign) return guidance
  return {
    ...guidance,
    recommendations: [...guidance.recommendations, {
      id: frontendDesign.id,
      why: 'Complementa a direção visual ao transformar a proposta em escolhas práticas de interface e frontend.',
      firstStep: 'Abra a skill e defina a identidade visual, os blocos da página e as referências de interação.',
    }],
  }
}

function asVector(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== 1024 || value.some((part) => typeof part !== 'number' || !Number.isFinite(part))) return null
  return value
}

function embeddingLiteral(vector: number[]): string { return `[${vector.join(',')}]` }

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function catalogText(item: CatalogForIndex): string {
  const topics = item.catalog_item_topics.map((row) => row.topics?.name).filter(Boolean).join(', ')
  const tags = item.catalog_item_tags.map((row) => row.tags?.name).filter(Boolean).join(', ')
  return [item.title, item.item_type, item.categories?.name ?? '', item.summary, item.own_content, item.instructions, topics, tags].join('\n').slice(0, 12000)
}

async function embed(env: Env, text: string): Promise<number[] | null> {
  try {
    const response = await env.AI.run('@cf/baai/bge-m3', { text, truncate_inputs: true }) as unknown as { data?: number[][] }
    return asVector(response.data?.[0])
  } catch {
    return null
  }
}

async function authenticate(request: Request, env: Env): Promise<{ supabase: SupabaseClient; userId: string }> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) throw new AssistantError('unauthorized', 401)
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new AssistantError('unauthorized', 401)
  const { data: profile, error: profileError } = await supabase.from('profiles').select('state').eq('id', data.user.id).maybeSingle()
  if (profileError || !profile || profile.state !== 'active') throw new AssistantError('forbidden', 403)
  return { supabase, userId: data.user.id }
}

async function recordUsage(supabase: SupabaseClient, userId: string, requestKind: 'text' | 'audio', outcome: 'success' | 'fallback' | 'rate_limited' | 'rejected' | 'failed') {
  await supabase.from('assistant_usage_events').insert({ user_id: userId, request_kind: requestKind, outcome })
}

async function enforceRateLimit(supabase: SupabaseClient, userId: string, requestKind: 'text' | 'audio') {
  const { count, error } = await supabase.from('assistant_usage_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date(Date.now() - WINDOW_MS).toISOString())
  if (error) throw new AssistantError('assistant_not_available', 503)
  if ((count ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
    await recordUsage(supabase, userId, requestKind, 'rate_limited')
    throw new AssistantError('assistant_rate_limited', 429)
  }
}

async function transcribe(env: Env, audio: File, duration: number): Promise<string> {
  if (!audio.type.startsWith('audio/') || audio.size === 0 || audio.size > MAX_AUDIO_BYTES || !Number.isFinite(duration) || duration <= 0 || duration > MAX_AUDIO_SECONDS) throw new AssistantError('invalid_audio', 400)
  try {
    const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: { body: audio.stream() as unknown as object, contentType: audio.type }, task: 'transcribe', language: 'pt', vad_filter: true, initial_prompt: 'O áudio descreve uma necessidade técnica de desenvolvimento, IA, cloud ou automação.',
    }) as unknown as { text?: string; transcription_info?: { duration?: number } }
    if ((result.transcription_info?.duration ?? duration) > MAX_AUDIO_SECONDS) throw new AssistantError('audio_too_long', 400)
    const text = cleanText(result.text)
    if (!text) throw new AssistantError('audio_without_transcript', 422)
    return text
  } catch (error) {
    if (error instanceof AssistantError) throw error
    throw new AssistantError('audio_transcription_failed', 503)
  }
}

async function keywordSearch(supabase: SupabaseClient, query: string): Promise<AssistantCandidate[]> {
  const terms = query.toLocaleLowerCase('pt-BR').split(/\s+/).filter((term) => term.length > 1).slice(0, 10)
  const { data, error } = await supabase.from('catalog_items').select('id,slug,title,item_type,summary,own_content,official_url,instructions,categories(name)').eq('status', 'published').order('published_at', { ascending: false }).limit(120)
  if (error) throw new AssistantError('assistant_search_failed', 503)
  return (data ?? []).map((item) => {
    const haystack = `${item.title} ${item.item_type} ${item.summary} ${item.own_content}`.toLocaleLowerCase('pt-BR')
    return { ...item, category: item.categories?.name ?? 'Acervo', relevance: terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) }
  }).filter((item) => item.relevance > 0).sort((left, right) => right.relevance - left.relevance).slice(0, 20) as AssistantCandidate[]
}

async function findCandidates(supabase: SupabaseClient, env: Env, query: string): Promise<AssistantCandidate[]> {
  const vector = await embed(env, query)
  if (!vector) return dedupeAssistantCandidates(await keywordSearch(supabase, query))
  const { data, error } = await supabase.rpc('search_catalog_for_assistant', { query_text: query, query_embedding: embeddingLiteral(vector), match_count: 20 })
  if (error) return dedupeAssistantCandidates(await keywordSearch(supabase, query))
  return mergeAssistantCandidates((data ?? []) as AssistantCandidate[], await keywordSearch(supabase, query))
}

export function createFallbackGuidance(query: string, candidates: AssistantCandidate[]): AssistantGuidance {
  const recommendations = candidates.slice(0, 10).map((candidate) => ({
    id: candidate.id,
    why: candidate.summary.slice(0, 220) || `Relaciona-se diretamente ao objetivo: ${query}.`,
    firstStep: candidate.instructions.slice(0, 180) || 'Abra a fonte oficial e valide como este recurso se aplica ao projeto.',
  }))
  return {
    mode: 'fallback',
    summary: `Encontrei ${recommendations.length} recurso${recommendations.length === 1 ? '' : 's'} relacionado${recommendations.length === 1 ? '' : 's'} a “${query}”. A ordenação considera o conteúdo e os termos do acervo.`,
    recommendations,
  }
}

export function buildAssistantResult(query: string, transcript: string | undefined, guidance: AssistantGuidance, candidates: AssistantCandidate[]): AssistantResult {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]))
  const resourceIds = new Set<string>()
  const resources: AssistantResource[] = []

  for (const recommendation of guidance.recommendations) {
    if (resourceIds.has(recommendation.id)) continue
    const candidate = candidatesById.get(recommendation.id)
    if (!candidate) continue
    resourceIds.add(recommendation.id)
    const { own_content: _content, relevance: _relevance, ...resource } = candidate
    resources.push(resource)
  }

  return { query, ...(transcript ? { transcript } : {}), ...guidance, resources }
}

function advise(query: string, candidates: AssistantCandidate[]): AssistantGuidance {
  return createFallbackGuidance(query, candidates)
}

export async function handleAssistantRequest(request: Request, env: Env): Promise<{ body: AssistantResult; status: number }> {
  const { supabase, userId } = await authenticate(request, env)
  const multipart = request.headers.get('content-type')?.includes('multipart/form-data')
  const form = multipart ? await request.formData() : null
  const payload = form ? null : await request.json().catch(() => ({})) as { query?: unknown }
  const audio = form?.get('audio')
  const requestKind = audio instanceof File ? 'audio' : 'text'
  await enforceRateLimit(supabase, userId, requestKind)
  let transcript: string | undefined
  const audioDuration = Number(form?.get('audioDurationSeconds'))
  const query = audio instanceof File ? (transcript = await transcribe(env, audio, audioDuration)) : cleanText(payload?.query)
  if (query.length < 3) {
    await recordUsage(supabase, userId, requestKind, 'rejected')
    throw new AssistantError('invalid_assistant_query', 400)
  }
  const candidates = await findCandidates(supabase, env, enrichAssistantSearchQuery(query))
  const guidance = addVisualDesignComplement(query, advise(query, candidates), candidates)
  await recordUsage(supabase, userId, requestKind, guidance.mode === 'ai' ? 'success' : 'fallback')
  return { status: 200, body: buildAssistantResult(query, transcript, guidance, candidates) }
}

export async function indexCatalogEmbeddings(env: Env): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.from('catalog_items').select('id,title,item_type,summary,own_content,instructions,categories(name),catalog_item_topics(topics(name)),catalog_item_tags(tags(name))').eq('status', 'published').order('updated_at', { ascending: false }).limit(1000)
  if (error || !data?.length) return
  const items = data as CatalogForIndex[]
  const { data: saved } = await supabase.from('catalog_item_embeddings').select('catalog_item_id,content_hash').in('catalog_item_id', items.map((item) => item.id))
  const hashes = new Map((saved ?? []).map((row) => [row.catalog_item_id, row.content_hash]))
  const pending = [] as Array<{ item: CatalogForIndex; content: string; contentHash: string }>
  for (const item of items) { const content = catalogText(item); const contentHash = await sha256(content); if (hashes.get(item.id) !== contentHash) pending.push({ item, content, contentHash }) }
  for (const entry of pending.slice(0, 25)) {
    const vector = await embed(env, entry.content)
    if (!vector) return
    await supabase.from('catalog_item_embeddings').upsert({ catalog_item_id: entry.item.id, content_hash: entry.contentHash, embedding: embeddingLiteral(vector), indexed_at: new Date().toISOString() }, { onConflict: 'catalog_item_id' })
  }
}
