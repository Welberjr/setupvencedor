import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('centers reusable page headings and keeps install guidance inside the mobile viewport', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.page-heading {')
  expect(styles).toContain('.page-heading .page-title {')
  expect(styles).toContain('text-align: center')
  expect(styles).toContain('.pwa-guidance { position: fixed')
})
