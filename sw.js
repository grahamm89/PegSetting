const CACHE_NAME = 'dilution-cache-v1';
const urlsToCache = ['.', 'index.html', 'app.js', 'data.json', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});