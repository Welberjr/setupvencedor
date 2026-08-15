import { expect, it } from 'vitest'
import { verifyPublicRelease } from './verify-public-release.mjs'

const html = `<!doctype html><html><head><link rel="stylesheet" href="/assets/index-safe.css"><script type="module" src="/assets/index-safe.js"></script></head></html>`

it('accepts a release only when its page, stylesheet and script are coherent', async () => {
  const checked = await verifyPublicRelease({
    siteUrl: 'https://setupvencedor.com.br',
    fetchImpl: async (input) => {
      const url = String(input)
      if (url.includes('index-safe.css')) return new Response('.app-shell { color: black; }', { headers: { 'content-type': 'text/css' } })
      if (url.includes('index-safe.js')) return new Response('createRoot(document.body)', { headers: { 'content-type': 'application/javascript' } })
      return new Response(html, { headers: { 'content-type': 'text/html' } })
    },
  })

  expect(checked.stylesheet).toBe('https://setupvencedor.com.br/assets/index-safe.css')
  expect(checked.script).toBe('https://setupvencedor.com.br/assets/index-safe.js')
})

it('rejects a release that does not serve CSS as a stylesheet', async () => {
  await expect(verifyPublicRelease({
    siteUrl: 'https://setupvencedor.com.br',
    fetchImpl: async (input) => {
      const url = String(input)
      if (url.includes('index-safe.css')) return new Response('<html>not a stylesheet</html>', { headers: { 'content-type': 'text/html' } })
      if (url.includes('index-safe.js')) return new Response('createRoot(document.body)', { headers: { 'content-type': 'application/javascript' } })
      return new Response(html, { headers: { 'content-type': 'text/html' } })
    },
  })).rejects.toThrow('CSS')
})
