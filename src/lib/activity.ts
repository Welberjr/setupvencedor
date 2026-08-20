import { workerUrl } from './api/worker'
import { getSupabaseClient } from './supabase/client'

export type ActivityEventType = 'session_started' | 'catalog_search' | 'resource_opened' | 'resource_source_opened' | 'favorite_added' | 'favorite_removed'
export type BrowserActivityEvent = { eventType: ActivityEventType; catalogItemId?: string; searchTerm?: string }

const resourceEvents = new Set<ActivityEventType>(['resource_opened', 'resource_source_opened', 'favorite_added', 'favorite_removed'])

export function buildActivityEvent(eventType: ActivityEventType, input: { catalogItemId?: string; searchTerm?: string; userId?: string } = {}): BrowserActivityEvent | null {
  if (eventType === 'catalog_search') {
    const searchTerm = input.searchTerm?.replace(/\s+/g, ' ').trim().slice(0, 160)
    return searchTerm ? { eventType, searchTerm } : null
  }
  if (resourceEvents.has(eventType)) return input.catalogItemId ? { eventType, catalogItemId: input.catalogItemId } : null
  return { eventType }
}

export async function trackActivity(eventType: ActivityEventType, input?: { catalogItemId?: string; searchTerm?: string }): Promise<void> {
  const event = buildActivityEvent(eventType, input)
  if (!event) return
  try {
    const client = getSupabaseClient()
    const { data: { session } } = await client?.auth.getSession() ?? { data: { session: null } }
    if (!session) return
    await fetch(workerUrl('/v1/activity'), {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // A telemetria não deve interferir no fluxo principal do membro.
  }
}
