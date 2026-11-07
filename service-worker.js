// service-worker.js
const CACHE = 'skystrike-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/game.js',
  './src/entities.js',
  './src/level.js',
  './src/audio.js',
  './src/controls.js',
  './src/ui.js',
  './src/config.js',
  './src/storage.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // cache three.js CDN at runtime
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
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(()=>caches.match('./index.html'))));
});
