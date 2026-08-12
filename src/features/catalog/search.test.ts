import { expect, it } from 'vitest'
import { buildSearchTerms, explainMatch } from './search'

it('expands known catalog aliases while preserving the submitted terms', () => {
  expect(buildSearchTerms('site bonito UI')).toEqual(['site', 'bonito', 'ui', 'frontend', 'layout'])
})

it('explains the terms that produced a catalog result', () => {
  expect(explainMatch(['ui', 'frontend'], ['frontend'])).toBe('Encontrado por: frontend')
})
