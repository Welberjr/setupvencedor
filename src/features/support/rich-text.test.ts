import { expect, it } from 'vitest'
import { sanitizeSupportMarkup, toSupportPlainText } from './rich-text'

it('keeps only supported rich support markup', () => {
  expect(sanitizeSupportMarkup('<strong>Urgente</strong><script>alert(1)</script><a href="https://bad.example">link</a>')).toBe('<strong>Urgente</strong>link')
})

it('creates a readable plain message from supported markup', () => {
  expect(toSupportPlainText('<strong>Não consigo</strong><br><em>entrar</em>')).toBe('Não consigo entrar')
})
