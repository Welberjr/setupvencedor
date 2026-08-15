import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HanddrawnLabBadge } from './HanddrawnLabBadge'

it('opens the official platform in a separate browsing context', () => {
  render(<HanddrawnLabBadge />)

  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('link', { name: 'Comparar com a plataforma oficial' })).toHaveAttribute('rel', 'noreferrer')
})
