const CACHE_NAME = 'setup-vencedor-cache-v3-20260813-approved-brand'
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(SHELL_ASSETS)
      } catch {
        // Falha não bloqueia a instalação.
      }
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.startsWith('chrome-extension://')) return
  const requestUrl = new URL(event.request.url)
  if (requestUrl.pathname === '/sw.js' || requestUrl.pathname === '/manifest.webmanifest') {
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(event.request)

      if (event.request.mode === 'navigate') {
        try {
          const response = await fetch(event.request)
          if (response && response.status === 200) {
            await cache.put(event.request, response.clone())
          }
          return response
        } catch {
          return cached ?? (await cache.match('/'))
        }
      }

      if (cached) return cached

      try {
        const response = await fetch(event.request)
        if (response && response.status === 200 && response.type === 'basic') {
          await cache.put(event.request, response.clone())
        }
        return response
      } catch {
        return cached ?? Response.error()
      }
    })(),
  )
})
