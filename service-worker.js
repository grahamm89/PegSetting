const CACHE_NAME = 'qfm-peg-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['./','index.html','css/style.css','js/app.js','data.json'])));
});
self.addEventListener('fetch', e => {
  if(e.request.url.includes('data.json')){
    e.respondWith(fetch(e.request).then(r => {
      const resClone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, resClone));
      return r;
    }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
