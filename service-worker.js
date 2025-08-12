// PegSetting SW — auto-refresh + network-first for HTML/JSON
const CACHE_VERSION = 'peg-v202508120704';
const CACHE_NAME = 'peg-cache-' + CACHE_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE_ASSETS); } catch (e) { /* ignore missing */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null));
    await self.clients.claim();
    // Tell all tabs to reload once
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) {
      client.postMessage({ type: 'SW_ACTIVATED_RELOAD', version: CACHE_VERSION });
    }
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

  // cache-first for other assets
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
