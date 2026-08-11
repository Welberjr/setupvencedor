import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'

it('renders the protected application shell after a session is supplied', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
})
