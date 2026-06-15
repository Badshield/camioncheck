// Nom de la version du cache pour pouvoir invalider les anciennes versions lors des mises à jour
const CACHE_NAME = 'camioncheck-cache-v1'; 

// Liste des fichiers statiques indispensables à mettre en cache pour le fonctionnement hors-ligne de l'application
const ASSETS = [
  'index.html', // Fichier principal de l'application corrigé (remplace camioncheck.html pour éviter l'erreur 404)
  'manifest.json', // Fichier manifeste pour l'installation sur l'écran d'accueil
  'https://cdn.tailwindcss.com', // Script externe de Tailwind CSS mis en cache pour les styles
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' // Bibliothèque d'icônes FontAwesome
];

// Événement d'installation du Service Worker qui pré-charge les ressources indispensables
self.addEventListener('install', (e) => {
  e.waitUntil( // Attendre que la promesse interne soit résolue avant de valider l'installation
    caches.open(CACHE_NAME).then((cache) => { // Ouverture ou création de l'espace de cache spécifié
      return cache.addAll(ASSETS); // Téléchargement et stockage de tous les éléments listés dans la constante ASSETS
    }).then(() => self.skipWaiting()) // Force l'activation immédiate du nouveau Service Worker sans attendre
  );
});

// Événement d'activation du Service Worker pour faire le ménage dans les anciens caches stockés
self.addEventListener('activate', (e) => {
  e.waitUntil( // Garantit que l'activation ne se termine pas avant le nettoyage complet du cache obsolète
    caches.keys().then((keys) => { // Récupération de l'ensemble des clés de cache stockées dans le navigateur
      return Promise.all( // Exécution simultanée des suppressions de caches obsolètes
        keys.map((key) => { // Parcours de chaque clé de cache trouvée
          if (key !== CACHE_NAME) { // Si le nom du cache est différent de la version courante
            return caches.delete(key); // Supprimer définitivement l'ancien cache obsolète pour libérer de l'espace
          }
        })
      );
    }).then(() => self.clients.claim()) // Permet au Service Worker de contrôler immédiatement toutes les pages actives
  );
});

// Interception des requêtes réseau pour servir instantanément les fichiers depuis le cache si on est hors-ligne
self.addEventListener('fetch', (e) => {
  e.respondWith( // Fournit une réponse alternative personnalisée à la requête interceptée
    caches.match(e.request).then((cachedResponse) => { // Vérification de la présence de la ressource demandée dans le cache
      if (cachedResponse) { // Si la ressource est trouvée localement dans le cache
        return cachedResponse; // Renvoyer le fichier du cache immédiatement pour des performances ultrarapides
      }
      return fetch(e.request).catch(() => { // Sinon, exécuter la requête classique sur le réseau internet
        // Optionnel : Gestionnaire alternatif si le réseau et le cache échouent en même temps
      });
    })
  );
});
