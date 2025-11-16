const CACHE_NAME = 'evalion-vertex-cache-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './src/assets/i18n/en.json',
  './src/assets/i18n/ru.json',
  './src/assets/i18n/fr.json',
  './src/assets/i18n/nl.json',
  './src/assets/i18n/ja.json',
  './src/assets/i18n/zh.json',
  './src/assets/i18n/ar.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignore non-GET requests and requests to our backend API to avoid caching auth tokens or API data.
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  
  // Network falling back to cache strategy
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If the fetch is successful, cache the response and return it
        // Check if we received a valid, cacheable response
        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          // 'basic' type indicates same-origin requests. We don't want to cache opaque responses from CDNs.
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // If the fetch fails (e.g., offline), try to get the response from the cache
        return caches.match(event.request).then(cachedResponse => {
          // If we have a cached response, return it.
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache and network failed, the browser will show its offline page.
        });
      })
  );
});