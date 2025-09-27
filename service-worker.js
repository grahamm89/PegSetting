// Enhanced SW with versioned cache + skipWaiting + data.json bypass
const SW_VERSION = '1759050000';
const CACHE_NAME = 'pwa-cache-v' + SW_VERSION;
const INDEX_PATH = new URL('index.html', self.location).pathname;
const ASSETS = [
  new URL('./', self.location).pathname,
  new URL('index.html', self.location).pathname,
  new URL('manifest.json', self.location).pathname,
  new URL('css/style.css', self.location).pathname,
  new URL('js/app.js', self.location).pathname,
  new URL('js/pwa.js', self.location).pathname,
  new URL('js/limits.js', self.location).pathname,
  new URL('js/admin-inline.js', self.location).pathname
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
      const cached = await cache.match(INDEX_PATH);
      try {
        const fresh = await fetch(event.request);
        cache.put(INDEX_PATH, fresh.clone());
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
