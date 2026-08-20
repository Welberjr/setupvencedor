import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ActivityAnalytics } from './ActivityAnalytics'

vi.mock('../../lib/supabase/client', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'session-token' } } }) } }),
}))

afterEach(() => vi.unstubAllGlobals())

it('shows the most searched terms and opened resources for the selected period', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    periodDays: 30,
    eventTotals: [{ eventType: 'resource_opened', count: 7 }],
    topSearches: [{ searchTerm: 'Cloudflare Workers', count: 4 }],
    topResources: [{ title: 'Cloudflare Workers', count: 3 }],
  }), { status: 200 })))

  render(<ActivityAnalytics />)

  await waitFor(() => expect(screen.getByText('Termos mais buscados')).toBeInTheDocument())
  expect(screen.getAllByText('Cloudflare Workers')).toHaveLength(2)
  expect(screen.getByText('7 aberturas de recursos')).toBeInTheDocument()
})
