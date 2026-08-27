/* ============================================================
 * sw.js — Service Worker | Platform Penilaian FKIP ULM
 * Strategy:
 *   - HTML & Code Modules (/src/*): Network-first (always fresh, fallback to cache)
 *   - Assets (images, fonts): Stale-while-revalidate
 * ============================================================ */

const CACHE_VERSION = 'v2.4.37';
const STATIC_CACHE  = `pgsd-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pgsd-runtime-${CACHE_VERSION}`;

// All modular JS/CSS files to precache on install
const PRECACHE_MODULES = [
  '/',
  '/index.html',
  '/admin',
  '/admin.html',
  '/manifest.json',
  '/src/admin/admin.css?v=2.4.37',
  '/src/admin/admin.js?v=2.4.37',
  '/src/student/index.css?v=2.4.37',
  '/src/student/student.js?v=2.4.37',
  '/assets/logo-ulm.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

// ---- INSTALL: Activate immediately & precache ----
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_MODULES).catch(() => {}))
  );
});

// ---- ACTIVATE: Delete all legacy caches & claim clients immediately ----
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

  // Skip non-GET and external requests (Supabase API, Google CDN, KaTeX, etc)
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin)) return;

  // 1. JS/CSS modules & HTML pages — Network-first (Always fetch fresh from server, fallback to cache)
  if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '/admin') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Static Assets (Images, Icons) — Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(res => {
        if (res && res.status === 200) {
          caches.open(RUNTIME_CACHE).then(c => c.put(event.request, res.clone()));
        }
        return res;
      }).catch(() => null);
      return cached || fetchPromise;
    })
  );
});

// ---- MESSAGE: Force update & cache purge from client ----
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PURGE_CACHES') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
