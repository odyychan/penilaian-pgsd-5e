/* ============================================================
 * sw.js — Service Worker | Platform Penilaian FKIP ULM
 * Strategy:
 *   - HTML: Network-first (always fresh)
 *   - JS/CSS modules (/src/*): Cache-first (immutable, versioned)
 *   - Assets: Stale-while-revalidate
 * ============================================================ */

const CACHE_VERSION = 'v2.4.27';
const STATIC_CACHE  = `pgsd-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pgsd-runtime-${CACHE_VERSION}`;

// All modular JS/CSS files to precache on install
const PRECACHE_MODULES = [
  '/',
  '/index.html',
  '/admin',
  '/admin.html',
  '/manifest.json',
  '/src/admin/admin.css',
  '/src/admin/admin.js',
  '/src/student/index.css',
  '/src/student/student.js',
  '/assets/logo-ulm.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

// ---- INSTALL: Precache all static modules ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_MODULES))
      .then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: Delete old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- FETCH: Route-based strategy ----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and external requests
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) && !url.pathname.startsWith('/')) return;

  // 1. JS/CSS modules — Cache-first (immutable)
  if (url.pathname.startsWith('/src/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // 2. HTML pages — Network-first (always fresh)
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '/admin') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Assets — Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(res => {
        caches.open(RUNTIME_CACHE).then(c => c.put(event.request, res.clone()));
        return res;
      });
      return cached || fetchPromise;
    })
  );
});

// ---- MESSAGE: Force update from client ----
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
