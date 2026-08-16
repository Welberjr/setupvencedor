import { expect, it } from 'vitest'
import { createRevisionedServiceWorker } from './revision-service-worker'

it('adds the release revision to the service worker without enabling an application fetch cache', () => {
  const worker = createRevisionedServiceWorker("self.addEventListener('install', () => {})\n", 'release-20260816')

  expect(worker).toContain("const SETUP_VENCEDOR_RELEASE = 'release-20260816'")
  expect(worker).not.toContain("addEventListener('fetch'")
})
