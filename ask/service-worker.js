self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

/* Pas de cache agressif pour l’instant */
self.addEventListener("fetch", (event) => {
  // laisse passer toutes les requêtes réseau
});
