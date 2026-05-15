// public/sw.js
//
// MarketGrow Service Worker — Gap 5a
//
// Strategieen:
//   1. Navigation requests (HTML pages): network-first, valt terug op /offline.html
//   2. Static assets (/_next/static, /icons, /fonts): cache-first
//   3. API requests: NIET cachen (per-tenant, time-sensitive, kruist origin via
//      api.marketgrow.ai dus komt sowieso niet door deze fetch listener)
//
// Push handler en notificationclick worden in Gap 5b uitgebreid. Voor 5a
// staan ze als no-op placeholders zodat de browser ze al registreert en
// de scope-permissions klaar zijn.
//
// Cache versie bumpen: verhoog CACHE_VERSION zodat oude caches geleegd worden.

const CACHE_VERSION = 'marketgrow-v1';
const OFFLINE_URL   = '/offline.html';

// Precache: alleen het allernoodzakelijkste. We pre-cachen GEEN Next.js
// chunks omdat die per build hashes hebben en runtime worden opgehaald.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Alleen GET cachen
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Sla niet-http(s) over (chrome-extension, data:, etc.)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // Sla cross-origin over (laat browser standaard fetchen)
  if (url.origin !== self.location.origin) return;

  // Sla same-origin /api/* over (Next.js route handlers zoals admin-proxy)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first met offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Static assets (Next.js chunks, iconen, fonts): cache-first
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname === '/manifest.webmanifest' ||
    /\.(?:woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(handleStatic(request));
    return;
  }

  // Alles wat overblijft: network, fail-through naar browser default
});

// ── Navigation handler ───────────────────────────────────────
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch {
    const cache  = await caches.open(CACHE_VERSION);
    const cached = await cache.match(OFFLINE_URL);
    if (cached) return cached;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// ── Static cache-first handler ───────────────────────────────
async function handleStatic(request) {
  const cache    = await caches.open(CACHE_VERSION);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Cache alleen succesvolle, basic-type responses
    if (response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // Geen cache, geen netwerk — laat de browser het oplossen
    return new Response('', { status: 504 });
  }
}

// ── Push notifications (placeholder — wordt uitgebreid in Gap 5b) ──
self.addEventListener('push', (event) => {
  // In Gap 5b: parse event.data.json() en toon notification
  // met title/body/icon/badge/url uit de payload.
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MarketGrow', body: event.data.text() };
  }

  const title = payload.title || 'MarketGrow';
  const options = {
    body:   payload.body  || '',
    icon:   payload.icon  || '/icons/icon-192.png',
    badge:  payload.badge || '/icons/icon-192.png',
    data:   { url: payload.url || '/dashboard' },
    tag:    payload.tag   || 'marketgrow-default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — open of focus de app ────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Probeer een bestaande tab te hergebruiken
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        } catch {}
      }
      // Geen tab open — open een nieuwe
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
