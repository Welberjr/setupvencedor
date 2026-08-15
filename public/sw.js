const LEGACY_CACHE_PREFIX = 'setup-vencedor-cache-'

// O PWA continua instalável, mas a plataforma não mantém HTML, CSS ou
// JavaScript no cache local. O Cloudflare Pages e os nomes com hash dos assets
// já entregam a versão correta sem o risco de misturar releases.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(LEGACY_CACHE_PREFIX))
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
