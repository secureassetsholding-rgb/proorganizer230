// Service Worker - OrganizerPro v2.0
const CACHE_VERSION = 'v2.0';
const CACHE_NAME = `organizerpro-${CACHE_VERSION}`;

// Lista de recursos estáticos a cachear
const STATIC_CACHE = [
  './',
  './index.html',
  './login.html',
  './calendario.html',
  './contactos.html',
  './tareas.html',
  './recordatorios.html',
  './gastos.html',
  './admin.html',
  './notas.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Añade aquí otros archivos estáticos si los tienes (CSS, JS, imágenes)
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cachando recursos estáticos...');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        console.log('[SW] Instalación completada');
        return self.skipWaiting(); // Activar inmediatamente
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activación completada');
      return self.clients.claim(); // Tomar control de todas las páginas
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Solo cachear solicitudes GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      // Si hay respuesta en caché, devuélvela
      if (response) {
        console.log('[SW] Respondiendo desde caché:', request.url);
        return response;
      }

      // Si no hay caché, intenta obtener desde red
      console.log('[SW] Buscando en red:', request.url);
      return fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();

          // Guardar en caché para futuras visitas
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
            console.log('[SW] Recurso cachado:', request.url);
          });

          return networkResponse;
        }

        // Si falla la red
        if (request.destination === 'document') {
          // Para páginas HTML, muestra index.html en offline
          console.log('[SW] Offline: mostrando index.html');
          return caches.match('./index.html');
        }

        // Para otros recursos (imágenes, CSS, etc.), devuelve error
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }).catch(() => {
        // Si falla todo, intenta devolver index.html para navegación
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Opción para actualizar manualmente el SW (útil en desarrollo)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Recibido mensaje: SKIP_WAITING');
    self.skipWaiting();
  }
});