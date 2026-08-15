import { expect, it } from 'vitest'
import { getResourceProfilePilot } from './resource-profile-pilots'

it('returns the editorial visual guide only for Frontend Design', () => {
  const pilot = getResourceProfilePilot('skills-frontend-design')

  expect(pilot).toMatchObject({ kind: 'editorial', heading: 'Da ideia à primeira tela' })
  expect(pilot?.steps.map((step) => step.title)).toEqual([
    'Defina a missão',
    'Dê um clima à interface',
    'Peça direção antes de código',
    'Teste a primeira tela',
  ])
})

it('returns the selectable visual sequence only for Web Design Premium', () => {
  const pilot = getResourceProfilePilot('skills-web-design-premium')

  expect(pilot).toMatchObject({ kind: 'visual-steps', heading: 'Construa com intenção' })
  expect(pilot?.steps).toHaveLength(4)
  expect(pilot?.steps[0]).toMatchObject({ title: 'Objetivo', claudeLabel: 'Copiar para Claude Code', codexLabel: 'Copiar para Codex' })
})

it('does not give an ordinary resource either pilot treatment', () => {
  expect(getResourceProfilePilot('mcps-context7')).toBeNull()
})
