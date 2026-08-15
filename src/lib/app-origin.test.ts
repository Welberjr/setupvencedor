import { expect, it } from 'vitest'
import { normalizeAppOrigin } from './app-origin'

it('uses the staging origin supplied at build time', () => {
  expect(normalizeAppOrigin('https://staging.setup-vencedor-staging.pages.dev/')).toBe('https://staging.setup-vencedor-staging.pages.dev')
})

it('keeps the official origin when no build origin is supplied', () => {
  expect(normalizeAppOrigin()).toBe('https://setupvencedor.com.br')
})
