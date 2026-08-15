import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps the auth bootstrap visually silent while restoring the session', () => {
  const source = readFileSync('src/main.tsx', 'utf8')

  expect(source).not.toContain('CARREGANDO ACESSO SEGURO')
})

it('ships the handdrawn release with a fresh service worker cache', () => {
  const serviceWorker = readFileSync('public/sw.js', 'utf8')

  expect(serviceWorker).toContain("const CACHE_NAME = 'setup-vencedor-cache-v4-20260815-handdrawn-release'")
})
