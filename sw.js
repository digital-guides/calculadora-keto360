// /calculadora-keto360/sw.js
const ROOT  = '/calculadora-keto360/';
const CACHE = 'keto360-v3';

// Archivos mínimos para offline.
// Si luego tienes CSS/JS/imágenes locales en el repo, agrégalas aquí como ROOT + 'ruta'
const ASSETS = [
  ROOT,
  ROOT + 'index.html',
  ROOT + 'manifiesto.webmanifest',
  ROOT + 'icon-192.png',
  ROOT + 'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML: network-first (para ver cambios); resto: cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejar lo que esté dentro del scope /calculadora-keto360/
  if (!url.pathname.startsWith(ROOT)) return;

  const acceptsHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (acceptsHTML) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then(r => r || caches.match(ROOT + 'index.html'))
      )
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
