import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const headers = readFileSync('public/_headers', 'utf8')

it('ships browser hardening headers without weakening the app delivery cache', () => {
  expect(headers).toContain('Content-Security-Policy:')
  expect(headers).toContain('https://static.cloudflareinsights.com')
  expect(headers).toContain("frame-ancestors 'none'")
  expect(headers).toContain('X-Content-Type-Options: nosniff')
  expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin')
  expect(headers).toContain('Permissions-Policy: camera=(), microphone=(), geolocation=()')
})
