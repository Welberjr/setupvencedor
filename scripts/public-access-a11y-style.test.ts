import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const styles = readFileSync('src/styles/handdrawn-pages.css', 'utf8')

it('keeps the public access eyebrow readable on paper', () => {
  expect(styles).toContain('.handdrawn-lab .public-access-form > .eyebrow')
  expect(styles).toContain('color: #5a6070')
})
