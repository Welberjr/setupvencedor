import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps the auth bootstrap visually silent while restoring the session', () => {
  const source = readFileSync('src/main.tsx', 'utf8')

  expect(source).not.toContain('CARREGANDO ACESSO SEGURO')
})

it('keeps the PWA installed without intercepting the application files', () => {
  const serviceWorker = readFileSync('public/sw.js', 'utf8')

  expect(serviceWorker).not.toContain("addEventListener('fetch'")
  expect(serviceWorker).toContain("const LEGACY_CACHE_PREFIX = 'setup-vencedor-cache-'")
  expect(serviceWorker).toContain('name.startsWith(LEGACY_CACHE_PREFIX)')
  expect(serviceWorker).toContain('self.clients.claim()')
})
