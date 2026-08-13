import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BrandMark } from './BrandMark'
import { CommandIcon } from './CommandIcon'

it('renders the custom SV monogram with a product label', () => {
  render(<BrandMark />)
  expect(screen.getByLabelText('Setup Vencedor')).toBeInTheDocument()
  expect(screen.getByTestId('brand-mark-ribbon')).toBeInTheDocument()
})

it('renders a faceted green detail arrow', () => {
  render(<CommandIcon name="arrow" />)
  expect(screen.getByTestId('command-icon-arrow')).toBeInTheDocument()
  expect(screen.getByTestId('detail-arrow-light-face')).toBeInTheDocument()
  expect(screen.getByTestId('detail-arrow-shadow-face')).toBeInTheDocument()
})
