// Lobar Parda service worker.
// AVVAL TARMOQ (network-first): internet bo'lsa har doim serverdagi eng yangi fayl olinadi,
// shuning uchun GitHub'ga yuklangan o'zgarishlar hammaga keyingi ochilishdayoq yetib boradi.
// Internet bo'lmasa yoki juda sekin bo'lsa (4 soniyadan ko'p) - oxirgi saqlangan nusxa ishlatiladi.
// Bu faylni har o'zgarishda tahrirlash SHART EMAS.
const CACHE='lobar-pwa-v3';
const NETWORK_TIMEOUT=4000;
const SHELL=["./","./index.html","./manifest.json","./Lobar-katalog.csv","./assets/export.png","./assets/import.png","./css/mobile.css","./css/pwa.css","./css/refinement.css","./css/style.css","./css/update106.css","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192-maskable.png","./icons/icon-192.png","./icons/icon-512-maskable.png","./icons/icon-512.png","./js/andoza.js","./js/auth.js","./js/backup.js","./js/catalog-sync.js","./js/chek.js","./js/compact-select.js","./js/kalkulyator.js","./js/mahsulotlar.js","./js/main.js","./js/mijoz.js","./js/mobile.js","./js/pwa.js","./js/room-costs.js","./js/settings-intro.js","./js/startup.js","./js/state.js","./js/tarix.js","./js/ui.js","./js/utils.js","./js/vendor/html2canvas.min.js","./js/xona.js"];

self.addEventListener('install',e=>{
  self.skipWaiting(); // yangi versiya darhol ishga tushsin, eski oynalar yopilishini kutmasin
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))));
});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lobar-pwa-')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
  e.respondWith(networkFirst(e));
});
async function networkFirst(e){
  const req=e.request, cache=await caches.open(CACHE);
  // cache:'no-cache' - brauzerning HTTP keshini ham chetlab o'tib, serverdan tekshiradi.
  const network=fetch(req,{cache:'no-cache'}).then(res=>{
    if(res&&res.ok&&res.type==='basic')cache.put(req,res.clone()).catch(()=>{});
    return res;
  });
  const timeout=new Promise(resolve=>setTimeout(resolve,NETWORK_TIMEOUT,null));
  const res=await Promise.race([network.catch(()=>null),timeout]);
  if(res)return res;
  const cached=await cache.match(req,{ignoreSearch:true})
    ||(req.mode==='navigate'?await cache.match('./index.html'):null);
  if(cached){e.waitUntil(network.catch(()=>{}));return cached;}
  return network;
}
