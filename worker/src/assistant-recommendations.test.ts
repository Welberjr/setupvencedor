import { expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { addVisualDesignComplement, buildAssistantResult, createFallbackGuidance, dedupeAssistantCandidates, enrichAssistantSearchQuery, mergeAssistantCandidates } from './assistant'

const visualDirection = {
  id: 'visual-direction', slug: 'visual-direction', title: 'Direção visual para interfaces', item_type: 'Referência', category: 'Guias e referências',
  summary: 'Ajuda a criar uma identidade visual autoral.', own_content: '', official_url: 'https://example.com/visual', instructions: 'Defina público e sensação desejada.', relevance: 0.92,
}

const pydanticAi = {
  id: 'pydantic-ai', slug: 'pydantic-ai', title: 'PydanticAI', item_type: 'Ferramenta', category: 'IA e agentes',
  summary: 'Framework Python para agentes de IA.', own_content: '', official_url: 'https://example.com/pydantic', instructions: 'Instale o pacote.', relevance: 0.41,
}

it('returns only the resources explicitly selected for the objective', () => {
  const result = buildAssistantResult(
    'Quero criar uma LP inovadora com 3D, sem aparência de IA.',
    undefined,
    {
      mode: 'ai', summary: 'Comece com uma direção visual autoral para uma landing page impactante.',
      recommendations: [{ id: 'visual-direction', why: 'Define a identidade visual da página.', firstStep: 'Descreva público e a sensação desejada.' }],
    },
    [visualDirection, pydanticAi],
  )

  expect(result.resources).toEqual([
    expect.objectContaining({ id: 'visual-direction', title: 'Direção visual para interfaces' }),
  ])
})

it('enriches a visual landing-page objective so frontend design can be considered', () => {
  expect(enrichAssistantSearchQuery('Quero criar uma LP inovadora, com 3D e impactante')).toContain('frontend design interface landing page')
})

it('keeps the polished title when semantic search finds duplicate imported skills', () => {
  expect(dedupeAssistantCandidates([{ ...pydanticAi, id: 'frontend-slug', title: 'frontend-design' }, { ...visualDirection, id: 'frontend-official', title: 'Frontend Design' }])).toEqual([
    expect.objectContaining({ id: 'frontend-official', title: 'Frontend Design' }),
  ])
})

it('keeps direct keyword matches alongside semantic candidates for a visual objective', () => {
  const frontendDesign = { ...visualDirection, id: 'frontend-design', title: 'Frontend Design', relevance: 2 }
  expect(mergeAssistantCandidates([visualDirection], [frontendDesign])).toEqual([
    expect.objectContaining({ id: 'frontend-design', title: 'Frontend Design' }),
    expect.objectContaining({ id: 'visual-direction' }),
  ])
})

it('adds Frontend Design as a complementary resource for a visual landing-page objective', () => {
  const guidance = addVisualDesignComplement(
    'Quero criar uma LP inovadora, com 3D e impactante',
    { mode: 'ai', summary: 'Defina uma direção visual autoral.', recommendations: [{ id: 'visual-direction', why: 'Orienta a identidade.', firstStep: 'Defina o público.' }] },
    [visualDirection, { ...visualDirection, id: 'frontend-design', title: 'Frontend Design' }],
  )

  expect(guidance.recommendations.map((item) => item.id)).toEqual(['visual-direction', 'frontend-design'])
})

it('keeps the deterministic recommendation trail focused on four resources', () => {
  const guidance = createFallbackGuidance('quero criar uma landing page bonita', Array.from({ length: 5 }, (_, index) => ({ ...visualDirection, id: `resource-${index}` })))

  expect(guidance.recommendations).toHaveLength(4)
})

it('keeps recommendations grounded in the catalog without calling a generative model', () => {
  const source = readFileSync(existsSync('worker/src/assistant.ts') ? 'worker/src/assistant.ts' : 'src/assistant.ts', 'utf8')

  expect(source).not.toContain('api.openai.com')
})
