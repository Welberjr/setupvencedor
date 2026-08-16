import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
  background_color: string
  theme_color: string
}

it('uses the current light paper palette when launched as an installed app', () => {
  expect(manifest.theme_color).toBe('#fff7e5')
  expect(manifest.background_color).toBe('#fff7e5')
})
