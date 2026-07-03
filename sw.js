const CACHE = 'rota-v4';
const FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Leave alone: anything that isn't a simple GET for our own files.
  // All Supabase calls (Edge Functions + REST) and any POST/PUT/DELETE go
  // straight to the network, untouched, so headers and bodies are preserved.
  const isOurOrigin = url.origin === self.location.origin;
  if (req.method !== 'GET' || !isOurOrigin) {
    return; // browser handles normally
  }

  // NETWORK-FIRST for the app shell (HTML / manifest): always try to fetch the
  // freshest version when online, so new uploads appear immediately. Fall back
  // to the cached copy only when the network fails (offline). This prevents the
  // "my changes don't show up" problem caused by aggressive caching.
  const isAppShell = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('index.html')
    || url.pathname.endsWith('manifest.json');

  if (isAppShell) {
    e.respondWith(
      fetch(req)
        .then(resp => {
          // update the cache with the fresh copy
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // For any other same-origin GET: cache-first is fine (static assets).
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
