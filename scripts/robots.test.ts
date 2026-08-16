import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('ships valid crawler controls without exposing private access routes', () => {
  expect(existsSync('public/robots.txt')).toBe(true)
  const robots = readFileSync('public/robots.txt', 'utf8')
  expect(robots).toContain('User-agent: *')
  expect(robots).toContain('Disallow: /ativar')
  expect(robots).toContain('Disallow: /redefinir-senha')
  expect(robots).toContain('Disallow: /mcp/autorizar')
})
