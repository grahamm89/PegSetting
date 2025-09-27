// Enhanced SW with versioned cache + skipWaiting + data.json bypass
const SW_VERSION = '1758951308';
const CACHE_NAME = 'pwa-cache-v' + SW_VERSION;
const ASSETS = [
  '/', '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/pwa.js',
  '/js/limits.js',
  '/js/admin-inline.js'
  // NOTE: deliberately NOT caching /data.json
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Support "skip waiting" from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass cache for data.json (latest dataset)
  if (url.pathname.endsWith('/data.json')) {
    const noStoreReq = new Request(event.request, { cache: 'no-store' });
    event.respondWith(fetch(noStoreReq));
    return;
  }

  // For navigation and static assets: cache-first, then network fallback
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('/index.html');
      try {
        const fresh = await fetch(event.request);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const fresh = await fetch(event.request);
      // Only cache GET same-origin static files
      if (event.request.method === 'GET' && url.origin === self.location.origin) {
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
