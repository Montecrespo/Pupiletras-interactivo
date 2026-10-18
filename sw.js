const CACHE_NAME = 'sopa-letras-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'Monteza_resources/media/MapaPeru.png',
  'sonidos/exito.mp3',
  'sonidos/error.mp3'
];

// Almacenar todos los recursos en la memoria caché local al instalar
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activar el control de la aplicación de inmediato
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Servir los archivos desde el disco local para que funcione offline sin internet
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
