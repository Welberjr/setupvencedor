import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PublicSources } from './PublicSources'

it('renders the official link and the other public sources for a catalog item', () => {
  render(<PublicSources officialUrl="https://example.com/official" sourceUrls={['https://example.com/official', 'https://github.com/example/project']} />)

  expect(screen.getByRole('link', { name: 'Abrir fonte oficial' })).toHaveAttribute('href', 'https://example.com/official')
  expect(screen.getByRole('link', { name: 'Abrir fonte pública adicional 1' })).toHaveAttribute('href', 'https://github.com/example/project')
})
