// BuildStream field-app service worker.
// SAFE BY DESIGN: only intercepts GET requests for /field routes and static
// assets. Every other request (all admin pages, POST/server actions) is left
// entirely to the network — so nothing outside the field app is affected.
// Strategy is network-first: online always gets fresh content; the cache is a
// fallback only when there is no connection.

const CACHE = "bs-field-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never touch mutations / server actions

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isField = url.pathname === "/field" || url.pathname.startsWith("/field/");
  const isAsset =
    url.pathname.startsWith("/_next/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|ico|webmanifest)$/.test(url.pathname);

  // Leave everything else (admin pages, APIs) as pure network — unchanged behaviour.
  if (!isField && !isAsset) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("/offline")),
      ),
  );
});
