// FitnessTracker Personal — Service Worker v1
// Comparte origen (albap8668-sketch.github.io) con la app comercial /Fitness/:
// cache con prefijo propio y la limpieza solo toca caches de ESTA app.
const PREFIX = "fitness-personal-";
const CACHE = PREFIX + "v1";
const BASE = "/Fitness-Personal/";
const ASSETS = [
  BASE + "FitnessTracker.html",
  BASE + "manifest.json",
  BASE + "icon-180.png",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Al tocar la notificación de descanso terminado, enfocar (o abrir) la app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return clients.openWindow(BASE + "FitnessTracker.html");
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request).then(res => {
      if(!res || res.status !== 200 || res.type === "opaque") return res;
      const clone = res.clone();
      caches.open(CACHE).then(cache => cache.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
