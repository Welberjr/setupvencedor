import { expect, it } from 'vitest'
import { getAreaIllustration } from './illustration-registry'

it('maps Explore to its authored static illustration', () => {
  expect(getAreaIllustration('explore')).toEqual({
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados',
  })
})
