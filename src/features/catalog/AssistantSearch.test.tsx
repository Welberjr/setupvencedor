import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { AssistantSearch } from './AssistantSearch'
import type { CatalogItem } from './types'

const item = { id: '1', title: 'UI UX Pro Max' } as CatalogItem

it('does not show catalog results before the user starts a useful search', () => {
  render(<AssistantSearch query="" onQueryChange={vi.fn()} results={[item]} renderResults={() => <article>UI UX Pro Max</article>} />)

  expect(screen.queryByText('UI UX Pro Max')).not.toBeInTheDocument()
  expect(screen.getByText(/Digite pelo menos 2 caracteres/i)).toBeInTheDocument()
})

it('shows matching results after two useful characters', () => {
  render(<AssistantSearch query="ui" onQueryChange={vi.fn()} results={[item]} renderResults={() => <article>UI UX Pro Max</article>} />)

  expect(screen.getByText('UI UX Pro Max')).toBeInTheDocument()
})
