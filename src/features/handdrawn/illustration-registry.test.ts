import { expect, it } from 'vitest'
import { getAreaIllustration } from './illustration-registry'

it('maps Explore to its authored static illustration', () => {
  expect(getAreaIllustration('explore')).toEqual({
    src: '/illustrations/handdrawn/explore-library.webp',
    alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados',
  })
})

it.each([
  ['assistant', 'agents-orchestration.webp'],
  ['favorites', 'guides-notebook.webp'],
  ['support', 'tools-workbench.webp'],
  ['admin', 'cloud-infrastructure.webp'],
  ['auth', 'quality-shield.webp'],
] as const)('gives %s its own handdrawn artwork', (area, filename) => {
  expect(getAreaIllustration(area).src).toBe(`/illustrations/handdrawn/categories/${filename}`)
  expect(getAreaIllustration(area).alt.length).toBeGreaterThan(20)
})
