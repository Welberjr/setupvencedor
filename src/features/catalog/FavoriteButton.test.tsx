import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { FavoriteButton } from './FavoriteButton'

it('toggles a catalog item favorite without leaving the page', async () => {
  const user = userEvent.setup()
  const onToggle = vi.fn()
  render(<FavoriteButton title="Frontend Design" isFavorite={false} onToggle={onToggle} />)
  await user.click(screen.getByRole('button', { name: 'Favoritar Frontend Design' }))
  expect(onToggle).toHaveBeenCalledTimes(1)
})
