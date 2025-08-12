
const CACHE_VERSION = 'dilution-202508120835';
const CACHE_NAME = 'dilution-cache-' + CACHE_VERSION;
const CORE = ['./','./index.html','./manifest.json','./css/style.css','./js/app.js','./js/admin-inline.js','./js/pwa.js'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE); } catch (_){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k)));
    await self.clients.claim();
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) { client.postMessage({ type: 'SW_ACTIVATED_RELOAD', version: CACHE_VERSION }); }
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.html');
  const isJSON = url.pathname.endsWith('.json');
  if (isHTML || isJSON) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        if (isHTML) return await cache.match('./index.html');
        throw err;
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
