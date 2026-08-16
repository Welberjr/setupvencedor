import { expect, it } from 'vitest'
import { renderInvitationEmail } from './email-template'

it('renders a centered and escaped invitation with the activation URL intact', () => {
  const html = renderInvitationEmail({
    recipientName: '<Ana & Bruno>',
    email: 'ana@example.com',
    activationUrl: 'https://staging.setupvencedor.com.br/ativar?token=example',
  })

  expect(html).toContain('align="center"')
  expect(html).toContain('text-align:center')
  expect(html).toContain('https://staging.setupvencedor.com.br/ativar?token=example')
  expect(html).toContain('&lt;Ana &amp; Bruno&gt;')
  expect(html).toContain('Nunca pedimos sua senha por e-mail.')
})
