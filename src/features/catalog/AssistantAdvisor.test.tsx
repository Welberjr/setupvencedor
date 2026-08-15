import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AssistantAdvisor } from './AssistantAdvisor'

it('lets the person choose the agent without polluting the objective text', async () => {
  const user = userEvent.setup()
  render(<AssistantAdvisor onResult={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Hermes' }))

  expect(screen.getByRole('button', { name: 'Hermes' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('textbox', { name: 'Conte o resultado que você quer alcançar' })).toHaveValue('')
  expect(screen.queryByText('Começar do zero')).not.toBeInTheDocument()
})

it('accepts a named agent when the person chooses another tool', async () => {
  const user = userEvent.setup()
  render(<AssistantAdvisor onResult={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Outro' }))
  await user.type(screen.getByLabelText('Qual ferramenta você utiliza?'), 'Kiro')

  expect(screen.getByLabelText('Qual ferramenta você utiliza?')).toHaveValue('Kiro')
})
