import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BrandMark } from './BrandMark'
import { CommandIcon } from './CommandIcon'

it('renders the custom SV monogram with a product label', () => {
  render(<BrandMark />)
  expect(screen.getByLabelText('Setup Vencedor')).toBeInTheDocument()
})

it('renders the handmade curved detail arrow', () => {
  render(<CommandIcon name="arrow" />)
  expect(screen.getByTestId('command-icon-arrow')).toBeInTheDocument()
})
