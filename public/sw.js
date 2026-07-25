const CACHE_NAME = 'hkeeemai-cache-v1';
const urlsToCache = [
  '/',
  '/?utm_source=pwa'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية في ذاكرة التخزين المؤقت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الطلبات من الذاكرة المؤقتة عند انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
