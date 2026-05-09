const CACHE = 'hafezon-v2';
const BASE = '/hafezon';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([BASE + '/', BASE + '/index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigation requests → serve cached index.html for SPA offline support
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE + '/index.html')
        .then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Assets → network first, cache on success, fallback to cache
  event.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(event.request)
        .then(res => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cache.match(event.request))
    )
  );
});
