import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ExploreHero } from './ExploreHero'

it('shows the exact catalog total as a handdrawn note', () => {
  render(<ExploreHero totalItems={347} />)

  expect(screen.getByRole('heading', { name: 'Escolha o próximo atalho técnico.' })).toBeInTheDocument()
  expect(screen.getByText('347 recursos para descobrir.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Biblioteca desenhada/i })).toBeInTheDocument()
})
