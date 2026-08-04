// ============================================================
// SW.JS — offline ishlashi uchun ilova "qobig'i"ni (app shell) keshlaydi.
// Versiyani o'zgartirsangiz (masalan v2, v3...), foydalanuvchilarga
// yangi fayllar avtomatik yetkaziladi.
// ============================================================
var CACHE_NAME = 'parda-kalk-v4';
var APP_SHELL = [
  './index.html',
  './manifest.json?v=2',
  './css/style.css',
  './js/vendor/html2canvas.min.js',
  './js/utils.js',
  './js/state.js',
  './js/mijoz.js',
  './js/mahsulotlar.js',
  './js/xona.js',
  './js/andoza.js',
  './js/kalkulyator.js',
  './js/chek.js',
  './js/tarix.js',
  './js/backup.js',
  './js/main.js',
  './icons/icon-192.png?v=2',
  './icons/icon-512.png?v=2',
  './icons/icon-192-maskable.png?v=2',
  './icons/icon-512-maskable.png?v=2',
  './icons/apple-touch-icon.png?v=2',
  './icons/favicon-32.png?v=2'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(name){
        if(name !== CACHE_NAME) return caches.delete(name);
      }));
    })
  );
  self.clients.claim();
});

// Cache-first: avval keshdan, topilmasa tarmoqdan (va keshga qo'shib qo'yadi)
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resClone); });
        return res;
      }).catch(function(){
        // Offline va keshda ham yo'q — imkon qadar index.html'ga qaytaramiz
        return caches.match('./index.html');
      });
    })
  );
});
