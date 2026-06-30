const CACHE = 'rota-v3';
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

  // NEVER touch anything that isn't a simple GET for our own files.
  // All Supabase calls (Edge Functions + REST) and any POST/PUT/DELETE go
  // straight to the network, untouched, so headers and bodies are preserved.
  const isOurOrigin = url.origin === self.location.origin;
  if (req.method !== 'GET' || !isOurOrigin) {
    return; // let the browser handle it normally
  }

  // For our own static files: serve from cache, fall back to network.
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
