const CACHE_NAME = 'couples-financials-v18';
const STATIC_CACHE_NAME = 'couples-financials-static-v18';
const API_CACHE_NAME = 'couples-financials-api-v18';

const urlsToCache = [
  '/',
  '/auth',
  '/app',
  '/install',
  '/sobre-nos',
  '/privacy',
  '/terms',
  '/icons/icon-512x512.png?v=13',
  '/icons/icon-384x384.png?v=13',
  '/icons/icon-256x256.png?v=13',
  '/icons/icon-192x192.png?v=13',
  '/icons/icon-144x144.png?v=13',
  '/icons/icon-96x96.png?v=13',
  '/icons/icon-48x48.png?v=13',
  '/icons/favicon-32x32.png?v=13',
  '/icons/favicon-16x16.png?v=13',
  '/icons/maskable-icon-512x512.png?v=13',
  '/icons/maskable-icon-192x192.png?v=13',
  '/lovable-uploads/couples-financials-logo-new.png'
];

const API_URLS = [
  'https://elxttabdtddlavhseipz.supabase.co'
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v18...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate service worker with aggressive cleanup of ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v18...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ANY cache that is not v18
          if (!cacheName.includes('v18')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Fetch handler - NETWORK FIRST for HTML and lovable-uploads to prevent stale content
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const acceptHeader = event.request.headers.get('accept') || '';

  // Always bypass SW for tutorial static pages
  if (/^\/tutorial-couples-financials(-[a-z]{2})?\.html$/.test(url.pathname)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        if (url.pathname !== '/tutorial-couples-financials.html') {
          return fetch('/tutorial-couples-financials.html');
        }
        throw new Error('Tutorial not found');
      })
    );
    return;
  }

  // Handle API requests
  if (API_URLS.some(apiUrl => url.href.startsWith(apiUrl))) {
    const isGet = event.request.method === 'GET';
    const hasAuth = event.request.headers && event.request.headers.has('Authorization');

    if (isGet && !hasAuth) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
    } else {
      event.respondWith(
        fetch(event.request).catch(() => new Response(null, { status: 503 }))
      );
    }
    return;
  }

  // NETWORK FIRST for lovable-uploads (images) - prevents stale images on Safari/Mac
  if (url.pathname.startsWith('/lovable-uploads/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // NETWORK FIRST for navigations and HTML to prevent stale pages
  if (event.request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('/');
        })
    );
    return;
  }

  // Cache-first for other static assets (JS, CSS, fonts)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;

        return fetch(event.request)
          .then(response => {
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
      })
  );
});

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    self.registration.update();
  }
  // Force clear all caches on demand
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then(names => {
      Promise.all(names.map(name => caches.delete(name))).then(() => {
        console.log('[SW] All caches cleared by request');
      });
    });
  }
});
