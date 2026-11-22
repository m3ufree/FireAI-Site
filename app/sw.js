/* FireAI Web — Service Worker: офлайн-кэш приложения */
const CACHE = 'fireai-web-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // API-запросы к серверу FireAI никогда не кэшируем
  if (url.pathname.includes('/api/') || url.pathname.includes('/v1/')) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(req)
        .then((res) => {
          if (url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./'))
    )
  );
});
