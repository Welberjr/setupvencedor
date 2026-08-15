import { expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import worker from './index'

it('allows the handdrawn laboratory to call the administrative worker', async () => {
  const origin = 'https://handdrawn-lab.setup-vencedor.pages.dev'
  const response = await worker.fetch(new Request('https://setup-vencedor-worker.example/v1/admin/people', {
    headers: { origin },
    method: 'OPTIONS',
  }), {} as never)

  expect(response.headers.get('access-control-allow-origin')).toBe(origin)
  expect(response.headers.get('vary')).toContain('Origin')
})

it('does not grant worker access to an unknown web origin', async () => {
  const response = await worker.fetch(new Request('https://setup-vencedor-worker.example/v1/admin/people', {
    headers: { origin: 'https://unknown.example' },
    method: 'OPTIONS',
  }), {} as never)

  expect(response.headers.get('access-control-allow-origin')).toBeNull()
})

it('registers the authenticated Assistant recommendation endpoint before the admin routes', () => {
  const source = readFileSync(existsSync('worker/src/index.ts') ? 'worker/src/index.ts' : 'src/index.ts', 'utf8')

  expect(source).toContain("path === '/v1/assistant/recommendations'")
  expect(source).toContain('handleAssistantRequest(request, env)')
})
