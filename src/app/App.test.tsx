import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'

it('renders the protected application shell after a session is supplied', () => {
  render(<App session={{ user: { id: 'u1', email: 'dev@example.com' } }} />)
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
})

it('renders the login form when no session is supplied', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})
