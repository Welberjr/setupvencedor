import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { PwaInstallPrompt } from './PwaInstallPrompt'

it('opens and closes install guidance with Android and iOS instructions', async () => {
  const user = userEvent.setup()
  render(<PwaInstallPrompt />)

  await user.click(screen.getByRole('button', { name: 'Instalar app' }))
  expect(screen.getByText(/No Android/i)).toBeInTheDocument()
  expect(screen.getByText(/No iPhone ou iPad/i)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Fechar instruções' }))
  expect(screen.queryByText(/No Android/i)).not.toBeInTheDocument()
})
