import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('llms discovery document', () => {
  it('describes the public catalog for assistant discovery', () => {
    expect(existsSync('public/llms.txt')).toBe(true)
    const document = readFileSync('public/llms.txt', 'utf8')
    expect(document).toMatch(/^# Setup Vencedor/m)
    expect(document).toContain('## Páginas públicas')
    expect(document).toContain('https://setupvencedor.com.br/')
    expect(readFileSync('public/_redirects', 'utf8')).toContain('/llms.txt /llms.txt 200')
  })
})
