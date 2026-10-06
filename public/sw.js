/* Minimal offline support: cache the app shell and same-origin assets as they are used.
   Hashed build assets never change, so they are served cache-first. The page itself
   (index.html, manifest) is network-first so updates arrive, with the cache as fallback. */
const CACHE = 'spa-shell-v2';

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
  // The frozen previous version under legacy/ is served as is, never cached as this app's page.
  if (url.pathname.includes('/legacy/')) return;

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
  if (response.ok) {
    await cache.put(request, response.clone());
    await trim(cache);
  }
  return response;
}

/* Every release brings new hashed files and the old ones are never asked for again (R0 M14).
   Keep the newest MAX_FILES; the cache lists entries oldest first. */
const MAX_FILES = 60;

async function trim(cache) {
  const keys = await cache.keys();
  const stale = keys.length - MAX_FILES;
  for (let i = 0; i < stale; i++) await cache.delete(keys[i]);
}
