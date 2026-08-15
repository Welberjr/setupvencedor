import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CatalogPagination } from './CatalogPagination'

it('keeps large catalogs inside a compact page window', () => {
  render(<CatalogPagination currentPage={9} totalPages={18} onPageChange={vi.fn()} />)

  expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(5)
  expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Página 9' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Página 18' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Página 4' })).not.toBeInTheDocument()
  expect(screen.getAllByText('…')).toHaveLength(2)
})
