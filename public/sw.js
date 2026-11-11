const CACHE = 'hafezon-v4';
const BASE = '';

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

  // Navigation requests → network first so a new deploy is picked up right away
  // (a stale cached index.html points to old assets that no longer exist → blank page).
  // Falls back to the cached index.html when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(BASE + '/index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match(BASE + '/index.html'))
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
