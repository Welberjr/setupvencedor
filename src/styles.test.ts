import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('centers reusable page headings and keeps install guidance inside the mobile viewport', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.page-heading {')
  expect(styles).toContain('.page-heading .page-title {')
  expect(styles).toContain('text-align: center')
  expect(styles).toContain('.pwa-guidance { position: fixed')
})

it('keeps catalogue categories inside the Explore submenu without a horizontal rail', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.explore-submenu')
  expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
})

it('keeps assistant recommendations compact and easy to scan', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.assistant-answer > h2 { max-width: 720px')
  expect(styles).toContain('font-size: clamp(20px, 2vw, 28px)')
  expect(styles).toContain('.assistant-reasons p { margin: 8px 0 0; color: #c8d1e0; font-size: 14px')
  expect(styles).toContain('.assistant-reasons small { display: block')
})

it('centers the final assistant recommendation when the count is odd', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.assistant-reasons-odd > li:last-child { grid-column: 1 / -1')
  expect(styles).toContain('width: calc(50% - 7px)')
})

it('keeps resource profiles readable on desktop and mobile', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.resource-profile')
  expect(styles).toContain('max-width: 1180px')
  expect(styles).toContain('.resource-profile-grid')
})

it('fills the profile width when the information grid has an odd number of cards', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.resource-profile-grid > article:last-child:nth-child(odd)')
  expect(styles).toContain('grid-column: 1 / -1')
})

it('places source and favorite actions above the long profile content', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.resource-primary-actions')
  expect(styles).toContain('.source-copy-button')
})

it('centers prerequisites and justifies profile explanations without stretching the final line', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.resource-prerequisites { margin-top: 14px; text-align: center')
  expect(styles).toContain('text-align: justify')
  expect(styles).toContain('text-align-last: left')
})

it('centers and lowers the empty favorites state inside the available workspace', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toContain('.page-favorites .favorites-empty-zone {')
  expect(styles).toContain('place-items: start center')
  expect(styles).toContain('padding-top: clamp(100px, 13vh, 180px)')
  expect(styles).toContain('.page-favorites .empty-state {')
  expect(styles).toContain('margin: 0')
})
