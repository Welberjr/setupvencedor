import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { IllustratedHero } from './IllustratedHero'

it('keeps the heading and explanation as real text beside the artwork', () => {
  render(
    <IllustratedHero
      eyebrow="BEM-VINDO AO ACERVO"
      title="Escolha o próximo atalho técnico."
      description="Encontre o recurso certo."
      illustration={{ src: '/illustration.png', alt: 'Mapa desenhado' }}
    />,
  )

  expect(screen.getByRole('heading', { name: 'Escolha o próximo atalho técnico.' })).toBeInTheDocument()
  expect(screen.getByText('Encontre o recurso certo.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Mapa desenhado' })).toHaveAttribute('src', '/illustration.png')
})
