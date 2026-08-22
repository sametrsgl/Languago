/*
 * Languago Service Worker
 * Strategy: network-first for navigations (offline-capable landing via cache
 * fallback), cache-first for static assets, full passthrough for anything
 * authenticated/dynamic (/dashboard, /teacher, /api/*, any non-GET) so auth
 * and SSR responses are NEVER cached.
 */
const VERSION = 'languago-v1';
const STATIC_CACHE = `${VERSION}-static`;
const SHELL_CACHE = `${VERSION}-shell`;

// Truly static public shell — safe to precache and serve offline.
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/mascot.png',
  '/og-cover.png',
  '/robots.txt',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/indir',
];

// Requests that must ALWAYS go to the network and never be read from cache:
// authenticated app routes + API + anything non-GET (mutation/auth).
const PASSTHROUGH = ['/api/', '/dashboard', '/teacher', '/auth', '/signin', '/signup'];

function isPassthrough(url, request) {
  if (request && request.method !== 'GET') return true;
  const p = url.pathname;
  return PASSTHROUGH.some((prefix) => p.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Best-effort: only cache what realistically exists so a 404 doesn't
      // poison the shell.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) await cache.put(url, res);
          } catch {
            // offline/ignore — skip
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (url.origin !== self.location.origin || request.method !== 'GET') return;

  // Auth / API / app routes → network only (never cache, never offline-stale).
  if (isPassthrough(url, request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation (page loads) → network-first, cache fallback for offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          if (fresh && fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          // Last resort: serve the cached landing page.
          return (await caches.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts, manifest) → cache-first.
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font' || request.destination === 'manifest') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});