/**
 * Quick QR Service Worker - Optimised for Offline Use and Rapid Loading
 * Version: 20260403221454
 */

const CACHE_NAME = 'quickqr-cache-20260403221454'
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon-180x180.png',
  '/offline.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching strategy assets')
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Cache addAll failed:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('quickqr-')) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET' || !request.url.startsWith('http')) return

  const isStaticAsset = ASSETS_TO_CACHE.some(asset => request.url.endsWith(asset)) ||
    request.url.includes('/_next/static/') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cacheClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheClone)
            })
          }
          return networkResponse
        })
        return cachedResponse || fetchPromise
      })
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })
        return response
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          return cached || caches.match('/offline.html') || new Response('Offline - Not Cached', {
            status: 404,
            statusText: 'Not Found'
          })
        })
      })
  )
})
