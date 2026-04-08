// sw.js - Service Worker para Pastoral Juvenil
const CACHE_NAME = 'pastoral-v1';
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
  '/js/historial-recibos.js',
  '/js/cloudinary-delete.js',
  '/img/logo.jpg'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación - limpiar caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Estrategia: Network First con fallback a caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});