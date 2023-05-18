// https://vite-pwa-org.netlify.app/guide/inject-manifest.html
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (/(.js|.mjs|.css)$/.test(event.request.url)) {
    event.respondWith(fetch(event.request))
  } else {
    event.respondWith(fetch(event.request, { cache: 'no-store' }))
  }
})

// Cleanup Outdated Caches
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Prompt For Update Behavior
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})
