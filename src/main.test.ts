import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps the auth bootstrap visually silent while restoring the session', () => {
  const source = readFileSync('src/main.tsx', 'utf8')

  expect(source).not.toContain('CARREGANDO ACESSO SEGURO')
})
