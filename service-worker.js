// service-worker.js
const CACHE = 'gentechfly-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/banner-generacion-tech.jpg',
  './assets/logo-generacion-tech.jpg',
  './src/main.js?v=14',
  './src/game.js?v=14',
  './src/entities.js?v=14',
  './src/level.js?v=14',
  './src/curriculum.js?v=14',
  './src/audio.js?v=14',
  './src/controls.js?v=14',
  './src/ui.js?v=14',
  './src/config.js?v=14',
  './src/storage.js?v=14',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('unpkg.com/three')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request);
      if (cached) return cached;
      try {
        const res = await fetch(e.request);
        c.put(e.request, res.clone());
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    }));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
