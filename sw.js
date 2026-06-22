// Nom de la version du cache. Je l'ai passé en v2 pour forcer la mise à jour chez les utilisateurs existants
const CACHE_NAME = 'camioncheck-cache-v2'; 

// Liste des fichiers statiques indispensables à mettre en cache
const ASSETS = [
  'index.html',
  'manifest.json',
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

// Événement d'activation : on supprime les anciens caches (ex: v1)
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

// NOUVEAU : Stratégie "Stale-While-Revalidate" (Très important pour une PWA)
// On sert le fichier depuis le cache pour que l'app s'ouvre en 0.1s.
// MAIS en parallèle, on va chercher la dernière version sur le web pour mettre à jour le cache.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // On lance la requête réseau en arrière-plan
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // On s'assure que la requête est valide avant de la mettre en cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse.clone()); // Mise à jour silencieuse du cache
            });
        }
        return networkResponse;
      }).catch(() => {
        // Si le réseau échoue (mode totalement hors-ligne), on ne fait rien car on a déjà géré la réponse en cache
        console.log("Mode hors-ligne, utilisation exclusive du cache pour :", e.request.url);
      });
      
      // On retourne la réponse du cache IMMÉDIATEMENT si elle existe, sinon on attend la réponse réseau
      return cachedResponse || fetchPromise; 
    })
  );
});
