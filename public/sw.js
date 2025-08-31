const CACHE_NAME = 'couples-financials-v8';
const STATIC_CACHE_NAME = 'couples-financials-static-v8';
const API_CACHE_NAME = 'couples-financials-api-v8';

const urlsToCache = [
  '/',
  '/auth',
  '/app',
  '/sobre-nos',
  '/privacy',
  '/terms',
  '/lovable-uploads/7334c1f2-b2ea-42c6-8031-74d75d699133.png',
  '/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png',
  '/src/assets/hero-couple.jpg',
  '/src/assets/app-interface.jpg'
];

const API_URLS = [
  'https://elxttabdtddlavhseipz.supabase.co'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
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