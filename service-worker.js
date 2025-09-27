// service-worker.js (GitHub Pages friendly)
const SCOPE = new URL(self.registration.scope).pathname; // e.g. "/your-repo/" or "/"
const SW_VERSION = SCOPE + ':' + Date.now();
const CACHE = 'peg-cache-' + SW_VERSION;

const ASSETS = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'admin.html',
  SCOPE + 'manifest.json',
  SCOPE + 'css/style.css',
  SCOPE + 'js/app.js',
  SCOPE + 'js/limits.js',
  SCOPE + 'js/pwa.js',
  SCOPE + 'js/admin-inline.js'
  // NOTE: do NOT add data.json (we want live fetches)
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.waitUntil((async () => {
      const all = await self.clients.matchAll({includeUncontrolled:true, type:'window'});
      for (const client of all) {
        try { client.postMessage({type:'SW_VERSION', version: SW_VERSION}); } catch(e) {}
      }
    })());
  }
  if (event.data && event.data.type === 'ADMIN_FORCE_REFRESH') {
    event.waitUntil((async () => {
      const all = await self.clients.matchAll({includeUncontrolled:true, type:'window'});
      for (const client of all) {
        try { client.postMessage({type:'FORCE_REFRESH'}); } catch(e) {}
      }
    })());
  }
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass cache for dataset
  if (url.pathname === (SCOPE + 'data.json')) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })));
    return;
  }

  // Navigation: try fresh HTML with cache:'reload', update cache, notify clients
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'reload' });
        const cache = await caches.open(CACHE);
        await cache.put(SCOPE + 'index.html',
  SCOPE + 'admin.html', fresh.clone());
        const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsArr.forEach(c => c.postMessage({ type: 'NEW_CONTENT' }));
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(url.pathname)) || (await cache.match(SCOPE + 'index.html')) || Response.error();
      }
    })());
    return;
  }

  // Static assets: cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const fresh = await fetch(event.request);
      if (event.request.method === 'GET' && url.origin === self.location.origin) {
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});
