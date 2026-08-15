import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AssistantAdvisor } from './AssistantAdvisor'

it('adds a selected context hint to make a recommendation more precise', async () => {
  const user = userEvent.setup()
  render(<AssistantAdvisor onResult={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Codex' }))

  expect(screen.getByRole('textbox', { name: 'Conte o resultado que você quer alcançar' })).toHaveValue('Codex')
})
