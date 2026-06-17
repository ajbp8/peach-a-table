// Minimal service worker — caches the app shell for offline launch.
// Deliberately simple for Session 1; richer offline/recipe caching is later work.
const CACHE_NAME = "memory-kitchen-v2";
const APP_SHELL = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never let the cache serve a redirected response for a navigation.
  // Chrome refuses to fulfill a navigate request with a Response whose
  // redirected flag is true and fails the whole request with
  // net::ERR_FAILED ("This site can't be reached"). This bit us on "/":
  // it got precached while unauthenticated (so the real response was a
  // 307 to /login), and every later visit to "/" replayed that broken
  // redirect response forever, even after the redirect target was fixed.
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached && !cached.redirected) return cached;
      return fetch(event.request);
    })()
  );
});
