import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './env'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const eventTypes = ['session_started', 'catalog_search', 'resource_opened', 'resource_source_opened', 'favorite_added', 'favorite_removed', 'assistant_requested'] as const
const resourceEventTypes = new Set(['resource_opened', 'resource_source_opened', 'favorite_added', 'favorite_removed'])

export type ActivityEventType = typeof eventTypes[number]
export type ActivityInput = { eventType: ActivityEventType; catalogItemId?: string; searchTerm?: string }
export type ActivityEventRow = { id: string; event_type: ActivityEventType; catalog_item_id: string | null; search_term: string | null; created_at: string; catalog_items: { title: string } | null }
export type ActivityAnalytics = { periodDays: 7 | 30 | 90; eventTotals: Array<{ eventType: ActivityEventType; count: number }>; topSearches: Array<{ searchTerm: string; count: number }>; topResources: Array<{ title: string; count: number }> }

export class ActivityError extends Error {
  constructor(readonly code: string, readonly status: number) { super(code) }
}

function cleanSearchTerm(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\s+/g, ' ').trim().slice(0, 160)
  return normalized || null
}

export function parseActivityInput(value: unknown): ActivityInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  if (!eventTypes.includes(input.eventType as ActivityEventType)) return null
  const eventType = input.eventType as ActivityEventType
  if (eventType === 'catalog_search') {
    const searchTerm = cleanSearchTerm(input.searchTerm)
    return searchTerm ? { eventType, searchTerm } : null
  }
  if (resourceEventTypes.has(eventType)) {
    return typeof input.catalogItemId === 'string' && uuidPattern.test(input.catalogItemId) ? { eventType, catalogItemId: input.catalogItemId } : null
  }
  return { eventType }
}

function tokenFrom(request: Request): string | null {
  const value = request.headers.get('authorization')
  return value?.startsWith('Bearer ') ? value.slice(7) : null
}

async function requireActiveMember(request: Request, env: Env): Promise<{ supabase: SupabaseClient; userId: string }> {
  const token = tokenFrom(request)
  if (!token) throw new ActivityError('unauthorized', 401)
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new ActivityError('unauthorized', 401)
  const { data: profile, error: profileError } = await supabase.from('profiles').select('state').eq('id', data.user.id).maybeSingle()
  if (profileError || !profile || profile.state !== 'active') throw new ActivityError('forbidden', 403)
  return { supabase, userId: data.user.id }
}

export async function recordActivityRequest(request: Request, env: Env): Promise<void> {
  const input = parseActivityInput(await request.json())
  if (!input) throw new ActivityError('invalid_activity', 400)
  const { supabase, userId } = await requireActiveMember(request, env)
  const now = new Date().toISOString()
  const [{ error: profileError }, { error: eventError }] = await Promise.all([
    supabase.from('profiles').update({ last_seen_at: now }).eq('id', userId),
    supabase.from('activity_events').insert({ user_id: userId, event_type: input.eventType, catalog_item_id: input.catalogItemId ?? null, search_term: input.searchTerm ?? null }),
  ])
  if (profileError || eventError) throw new ActivityError('activity_not_recorded', 503)
}

function parsePeriodDays(value: string | null): 7 | 30 | 90 {
  return value === '7' || value === '90' ? Number(value) as 7 | 90 : 30
}

function topEntries(values: Array<string | null | undefined>, limit = 5): Array<{ value: string; count: number }> {
  const totals = new Map<string, number>()
  for (const value of values) if (value) totals.set(value, (totals.get(value) ?? 0) + 1)
  return [...totals.entries()].map(([value, count]) => ({ value, count })).sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)).slice(0, limit)
}

export async function loadActivityAnalytics(supabase: SupabaseClient, periodDays: 7 | 30 | 90): Promise<ActivityAnalytics> {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase.from('activity_events').select('id,event_type,catalog_item_id,search_term,created_at,catalog_items(title)').gte('created_at', since).order('created_at', { ascending: false }).limit(5000)
  if (error) throw new ActivityError('analytics_not_available', 503)
  const events = (data ?? []) as ActivityEventRow[]
  const eventTotals = eventTypes.map((eventType) => ({ eventType, count: events.filter((event) => event.event_type === eventType).length })).filter((entry) => entry.count > 0)
  return {
    periodDays,
    eventTotals,
    topSearches: topEntries(events.filter((event) => event.event_type === 'catalog_search').map((event) => event.search_term)).map(({ value, count }) => ({ searchTerm: value, count })),
    topResources: topEntries(events.filter((event) => event.event_type === 'resource_opened').map((event) => event.catalog_items?.title)).map(({ value, count }) => ({ title: value, count })),
  }
}

export async function loadPersonActivity(supabase: SupabaseClient, personId: string): Promise<ActivityEventRow[]> {
  if (!uuidPattern.test(personId)) throw new ActivityError('invalid_person', 400)
  const { data, error } = await supabase.from('activity_events').select('id,event_type,catalog_item_id,search_term,created_at,catalog_items(title)').eq('user_id', personId).order('created_at', { ascending: false }).limit(100)
  if (error) throw new ActivityError('activity_not_available', 503)
  return (data ?? []) as ActivityEventRow[]
}

export { parsePeriodDays }
