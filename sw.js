// Nom de la version du cache. V3 pour prendre en compte les nouveaux actifs et l'icône SVG
const CACHE_NAME = 'camioncheck-cache-v3'; 

// Liste des fichiers statiques indispensables à mettre en cache
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon.svg',
  'https://cdn.tailwindcss.com', 
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Événement d'installation : on pré-charge tout
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) 
  );
});

// Événement d'activation : on supprime les anciens caches (ex: v1, v2)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie "Stale-While-Revalidate" (Très important pour une PWA)
// On sert le fichier depuis le cache pour que l'app s'ouvre instantanément.
// En parallèle, on va chercher la dernière version sur le web pour mettre à jour le cache silencieusement.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse.clone()); // Mise à jour silencieuse du cache
            });
        }
        return networkResponse;
      }).catch(() => {
        // Mode totalement hors-ligne : utilisation exclusive du cache
        console.log("Mode hors-ligne, utilisation exclusive du cache pour :", e.request.url);
      });
      
      return cachedResponse || fetchPromise; 
    })
  );
});
