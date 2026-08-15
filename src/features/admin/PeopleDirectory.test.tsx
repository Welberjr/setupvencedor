import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PeopleDirectory } from './PeopleDirectory'

vi.mock('../../lib/supabase/client', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'session-token' } } }) } }),
}))

afterEach(() => vi.unstubAllGlobals())

it('explains when the signed-in user lacks administrative access to the directory', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })))

  render(<PeopleDirectory currentUserId="admin-1" refreshKey={0} />)

  await waitFor(() => expect(screen.getByText('Seu usuário não tem permissão para consultar os acessos.')).toBeInTheDocument())
})
