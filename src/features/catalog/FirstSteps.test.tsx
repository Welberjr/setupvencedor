import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FirstSteps } from './FirstSteps'

it('renders every first step in a separate numbered list item', () => {
  render(<FirstSteps steps={['Abrir a fonte', 'Validar no projeto', 'Registrar o padrão']} />)

  expect(screen.getByRole('list', { name: 'Primeiro passo' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByText('Validar no projeto')).toBeInTheDocument()
})
