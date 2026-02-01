const CACHE_NAME = "khmvoice-tv-v1";
const CORE_ASSETS = [
  "/index.html",
  "/journal.html",
  "/manifest.webmanifest",
  "/assets/khmvoice_img.png",
  "/assets/logo-khmvoice.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Cache-first for same-origin
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
