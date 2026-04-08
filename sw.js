// sw.js - Service Worker corregido
const APP_VERSION = '1.0.0';
const CACHE_NAME = `pastoral-${APP_VERSION}`;

// Archivos estáticos para cachear (solo GET)
const urlsToCache = [
  '/',
  '/index.html',
  '/panel-admin.html',
  '/biblioteca.html',
  '/consulta-pagos.html',
  '/css/estilos-globales.css',
  '/css/estilos-calendario.css',
  '/css/estilos-principales.css',
  '/css/estilos-admin.css',
  '/css/estilos-consulta-pagos.css',
  '/css/biblioteca.css',
  '/js/inicio-firebase.js',
  '/js/base-datos-nube.js',
  '/js/autenticacion.js',
  '/js/aplicacion.js',
  '/js/calendario.js',
  '/js/panel-admin.js',
  '/js/recibos.js',
  '/js/tabla-control.js',
  '/js/whatsapp.js',
  '/js/consulta-pagos.js',
  '/js/biblioteca-usuario.js',
  '/js/biblioteca-admin.js',
  '/js/historial-recibos.js',
  '/js/cloudinary-delete.js',
  '/js/seguridad.js',
  '/js/actualizacion.js',
  '/img/logo.jpg'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Cache ${CACHE_NAME} instalado`);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - limpiar caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`Eliminando cache antiguo: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Solo cachear peticiones GET
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Solo cachear peticiones GET (ignorar POST, PUT, DELETE)
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  // Para peticiones GET: Network First con fallback a caché
  event.respondWith(
    fetch(request)
      .then(response => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});