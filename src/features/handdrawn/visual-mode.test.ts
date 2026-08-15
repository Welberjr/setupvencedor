import { expect, it } from 'vitest'
import { readVisualMode } from './visual-mode'

it('keeps the published experience in handdrawn mode unless the legacy theme is explicitly requested', () => {
  expect(readVisualMode()).toBe('handdrawn-lab')
  expect(readVisualMode('unexpected')).toBe('handdrawn-lab')
})

it('allows the legacy command center only when explicitly requested', () => {
  expect(readVisualMode('handdrawn-lab')).toBe('handdrawn-lab')
  expect(readVisualMode('command-center')).toBe('command-center')
})
