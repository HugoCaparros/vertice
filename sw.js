const CACHE_NAME = 'vertice-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/css/base/reset.css',
  '/assets/css/base/variables.css',
  '/assets/css/base/typography.css',
  '/assets/js/main.js',
  '/pages/partials/footer.html'
];

// Instalación: Guardar archivos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// Activación: Limpiar cachés viejas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

// Interceptar peticiones (Modo Offline)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});