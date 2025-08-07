const CACHE_NAME = 'couples-financials-v3';
const STATIC_CACHE_NAME = 'couples-financials-static-v3';
const API_CACHE_NAME = 'couples-financials-api-v3';

const urlsToCache = [
  '/',
  '/auth',
  '/app',
  '/lovable-uploads/7334c1f2-b2ea-42c6-8031-74d75d699133.png',
  '/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png'
];

const API_URLS = [
  'https://elxttabdtddlavhseipz.supabase.co'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
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

// Fetch handler with better caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
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

  // Handle static assets and pages
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
      .catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
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