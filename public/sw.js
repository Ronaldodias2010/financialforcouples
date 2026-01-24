const CACHE_NAME = 'couples-financials-v17';
const STATIC_CACHE_NAME = 'couples-financials-static-v17';
const API_CACHE_NAME = 'couples-financials-api-v17';

// Contador de erros para auto-limpeza
let errorCount = 0;
const MAX_ERRORS_BEFORE_CLEANUP = 3;

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
  console.log('[SW] Installing v17...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate service worker with aggressive cleanup
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v17...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Limpar TODOS os caches antigos
          if (!cacheName.includes('v17')) {
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

// Fetch handler with improved strategy to avoid stale HTML
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const acceptHeader = event.request.headers.get('accept') || '';

  // Always bypass SW for tutorial static pages to avoid SPA/Cache interference
  if (/^\/tutorial-couples-financials(-[a-z]{2})?\.html$/.test(url.pathname)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se o arquivo específico do idioma der erro, tentar o principal
        if (url.pathname !== '/tutorial-couples-financials.html') {
          return fetch('/tutorial-couples-financials.html');
        }
        throw new Error('Tutorial not found');
      })
    );
    return;
  }

  // Handle API requests differently
  if (API_URLS.some(apiUrl => url.href.startsWith(apiUrl))) {
    const isGet = event.request.method === 'GET';
    const hasAuth = event.request.headers && event.request.headers.has('Authorization');

    if (isGet && !hasAuth) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Only cache successful GET responses without auth
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return caches.match(event.request);
          })
      );
    } else {
      // For authenticated or non-GET API requests, don't cache
      event.respondWith(
        fetch(event.request).catch(() => new Response(null, { status: 503 }))
      );
    }
    return;
  }

// For navigations and HTML, use network-first to prevent serving stale index.html
  if (event.request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Never cache 503 responses
          if (response.status === 503) {
            return response;
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

  // Handle static assets - cache-first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // Cache successful responses
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
});

// Check for updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Force update check
    self.registration.update();
  }
});