// Service Worker for H&H Luxury Storefront PWA (E-COM-121, PWA-002)
const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `hh-static-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `hh-images-${CACHE_VERSION}`;
const MAX_IMAGE_ENTRIES = 60;
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png'
];

/**
 * Trims excess entries from a CacheStorage instance to maintain strict memory/disk bounds on mobile devices.
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const excess = keys.slice(0, keys.length - maxEntries);
      await Promise.all(excess.map((request) => cache.delete(request)));
    }
  } catch {
    // Non-fatal cache trimming error
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE_NAME && key !== IMAGE_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation requests: Network-first with graceful offline shell fallback (PWA-002)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return (
          cachedOffline ||
          new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          })
        );
      })
    );
    return;
  }

  // 2. Next.js Optimized Images: Stale-While-Revalidate with LRU size bound (E-COM-121)
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const networkFetchPromise = fetch(event.request)
          .then(async (networkResponse) => {
            if (networkResponse.ok) {
              await cache.put(event.request, networkResponse.clone());
              trimCache(IMAGE_CACHE_NAME, MAX_IMAGE_ENTRIES);
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Serve cached version immediately if present; fetch fresh copy in background
        return cachedResponse || networkFetchPromise;
      })
    );
    return;
  }

  // 3. Static assets: Cache-first with network fallback
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
  }
});
