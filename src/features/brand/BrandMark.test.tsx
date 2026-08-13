import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BrandMark } from './BrandMark'
import { CommandIcon } from './CommandIcon'

it('renders the approved SV monogram asset with a product label', () => {
  render(<BrandMark />)
  expect(screen.getByRole('img', { name: 'Setup Vencedor' })).toBeInTheDocument()
  expect(screen.getByTestId('brand-mark-approved')).toHaveAttribute('src', '/brand/setup-vencedor-sv-approved.png')
})

it('renders a faceted green detail arrow', () => {
  render(<CommandIcon name="arrow" />)
  expect(screen.getByTestId('command-icon-arrow')).toHaveAttribute('data-direction', 'left')
  expect(screen.getByTestId('detail-arrow-light-face')).toBeInTheDocument()
  expect(screen.getByTestId('detail-arrow-shadow-face')).toBeInTheDocument()
})
