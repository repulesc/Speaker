/* Minimal offline support: cache the app shell and same-origin assets as they are used.
   Hashed build assets never change, so they are served cache-first. The page itself
   (index.html, manifest) is network-first so updates arrive, with the cache as fallback. */
const CACHE = 'spa-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('manifest.webmanifest');
  event.respondWith(isPage ? networkFirst(request) : cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request.mode === 'navigate' ? './' : request, response.clone());
    return response;
  } catch {
    return (await cache.match(request.mode === 'navigate' ? './' : request)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
