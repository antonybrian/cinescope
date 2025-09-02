// Service Worker for CineScope App
const CACHE_NAME = 'cinescope-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/src/styles/main.css',
    '/src/js/app.js',
    '/src/js/api.js',
    '/src/js/auth.js',
    '/src/js/favorites.js',
    '/src/js/ui.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Handle API requests differently
    if (event.request.url.includes('api.themoviedb.org')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response for caching
                    const responseToCache = response.clone();
                    
                    // Cache API responses for 5 minutes
                    caches.open(CACHE_NAME + '-api').then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                })
                .catch(() => {
                    // Return cached version if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Handle static assets
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // Fallback for offline scenarios
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});