import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

type WidgetOptions = {
  action: 'signup' | 'login' | 'recovery'
  callback: (token: string) => void
  'expired-callback': () => void
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  delete window.turnstile
})

afterEach(() => vi.unstubAllEnvs())

it('does not render a security challenge without a public site key', async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
  const { TurnstileChallenge } = await import('./TurnstileChallenge')

  expect(render(<TurnstileChallenge action="signup" onTokenChange={vi.fn()} />).container).toBeEmptyDOMElement()
})

it('renders an action-specific widget and clears an expired token', async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'public-site-key')
  const renderWidget = vi.fn<(container: HTMLElement, options: WidgetOptions) => string>(() => 'widget-1')
  const removeWidget = vi.fn()
  window.turnstile = { render: renderWidget, remove: removeWidget }
  const { TurnstileChallenge } = await import('./TurnstileChallenge')
  const onTokenChange = vi.fn()
  const mounted = render(<TurnstileChallenge action="recovery" onTokenChange={onTokenChange} />)

  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
  const [, options] = renderWidget.mock.calls[0]!
  expect(options.action).toBe('recovery')
  options.callback('verified-token')
  options['expired-callback']()
  expect(onTokenChange).toHaveBeenCalledWith('verified-token')
  expect(onTokenChange).toHaveBeenLastCalledWith('')

  mounted.unmount()
  expect(removeWidget).toHaveBeenCalledWith('widget-1')
})
