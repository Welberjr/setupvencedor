import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('publishes an official WhatsApp preview based on the approved brand', () => {
  const html = readFileSync('index.html', 'utf8')

  expect(html).toContain('property="og:title" content="Setup Vencedor"')
  expect(html).toContain('property="og:image" content="https://setup-vencedor.pages.dev/social-preview.png"')
  expect(html).toContain('name="twitter:card" content="summary_large_image"')
})

it('uses the approved SV mark for browser and installed-app icons', () => {
  const html = readFileSync('index.html', 'utf8')
  const manifest = readFileSync('public/manifest.webmanifest', 'utf8')

  expect(html).toContain('href="/favicon.ico"')
  expect(manifest).toContain('"src": "/icon-512.png"')
  expect(manifest).not.toContain('tÃ¡tica')
  expect(existsSync('public/favicon.ico')).toBe(true)
  expect(existsSync('public/apple-touch-icon.png')).toBe(true)
  expect(existsSync('public/social-preview.png')).toBe(true)
})
