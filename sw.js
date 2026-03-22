// AudioWave.app Service Worker
// Cache-first for app shell, network-first for API/streams

const CACHE_NAME = 'audiowave-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/utils.js',
    '/js/patterns.js',
    '/js/themes.js',
    '/js/radio.js',
    '/js/mic.js',
    '/js/favorites.js',
    '/js/gestures.js',
    '/js/onboarding.js',
    '/js/app.js',
    '/favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network-first for API calls and streams
    if (url.hostname.includes('radio-browser') ||
        url.hostname.includes('ipapi.co') ||
        url.hostname.includes('google') ||
        url.hostname !== self.location.hostname) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for app shell
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
