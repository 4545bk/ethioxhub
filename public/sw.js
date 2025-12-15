# Service Worker File(Placeholder)

# This file is requested by browsers looking for a service worker
# Currently not implemented - this placeholder prevents 404 errors

self.addEventListener('install', function (event) {
    console.log('Service worker installed (placeholder)');
});

self.addEventListener('fetch', function (event) {
    // Pass through - no caching for now
    return;
});
