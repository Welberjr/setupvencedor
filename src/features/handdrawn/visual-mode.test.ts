import { expect, it } from 'vitest'
import { readVisualMode } from './visual-mode'

it('keeps the official command center as the safe default', () => {
  expect(readVisualMode()).toBe('command-center')
  expect(readVisualMode('unexpected')).toBe('command-center')
})

it('activates the handdrawn laboratory only for its explicit build value', () => {
  expect(readVisualMode('handdrawn-lab')).toBe('handdrawn-lab')
})
