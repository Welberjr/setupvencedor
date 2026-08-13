import { describe, expect, it } from 'vitest'
import { isRedundantCategoryLabel } from './card-label'

describe('isRedundantCategoryLabel', () => {
  it('identifies when the category only repeats the resource type in plural', () => {
    expect(isRedundantCategoryLabel('Curso', 'Cursos')).toBe(true)
    expect(isRedundantCategoryLabel('MCP', 'MCPs')).toBe(true)
    expect(isRedundantCategoryLabel('Skill', 'Skills')).toBe(true)
  })

  it('keeps a category that adds useful context', () => {
    expect(isRedundantCategoryLabel('Referência', 'Guias e referências')).toBe(false)
  })
})
