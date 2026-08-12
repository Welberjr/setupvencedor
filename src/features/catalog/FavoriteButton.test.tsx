import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { FavoriteButton } from './FavoriteButton'

it('toggles a catalog item favorite without leaving the page', async () => {
  const user = userEvent.setup()
  render(<FavoriteButton title="Frontend Design" />)
  await user.click(screen.getByRole('button', { name: 'Favoritar Frontend Design' }))
  expect(screen.getByRole('button', { name: 'Remover Frontend Design dos favoritos' })).toBeInTheDocument()
})
