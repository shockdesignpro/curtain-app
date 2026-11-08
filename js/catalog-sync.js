// ============================================================
// CATALOG-SYNC.JS — standart mahsulotlar ro'yxatini (Lobar-katalog.csv)
// barcha qurilmalarda avtomatik yangilash.
//
// QANDAY ISHLAYDI:
//  - Ilova har ochilganda (va orqa fondan qaytganda) Lobar-katalog.csv faylini
//    serverdan oladi. Fayl mazmuni oldingi safardagidan farq qilsa, standart
//    mahsulotlar shu fayl bo'yicha yangilanadi: narx, nom, birlik, bo'lim.
//  - Faylga qo'shilgan mahsulot hammaga qo'shiladi, fayldan olib tashlangani
//    hammadan olib tashlanadi.
//  - Xodim o'z telefonida QO'LDA qo'shgan (faylda yo'q) mahsulotlar saqlanib qoladi.
//  - Fayl o'zgarmagan bo'lsa, hech narsa qilinmaydi.
//
// mahsulotlar.js (parseCatalogCSV) dan KEYIN, main.js dan OLDIN yuklanadi.
// ============================================================

var CATALOG_FILE = 'Lobar-katalog.csv';
// Avvalgi versiyalarda kod ichida bo'lgan standart mahsulotlar ID'lari (1-34).
// Birinchi sinxronlashda shular "standart" deb hisoblanadi - fayldan olib
// tashlangan takrorlar (masalan, ikkinchi "Tesma") qurilmalardan ham o'chadi.
var CATALOG_LEGACY_IDS = (function(){var a=[];for(var i=1;i<=34;i++)a.push(i);return a;})();

function catalogHash(text){
  var h=5381;
  for(var i=0;i<text.length;i++){h=((h<<5)+h+text.charCodeAt(i))|0;}
  return (h>>>0).toString(16)+'-'+text.length;
}
function catalogKey(p){return String(p.bolim)+'|'+String(p.name||'').trim().toLocaleLowerCase();}

// Katalog matnini qo'llaydi. Biror narsa o'zgargan bo'lsa true qaytaradi.
function syncDefaultCatalog(text){
  if(typeof text!=='string'||!text.trim())return false;
  var hash=catalogHash(text);
  if(safeGetLS('parda_catalog_hash',null)===hash)return false;

  var items;
  try{ items=parseCatalogCSV(text); }
  catch(err){ console.error(CATALOG_FILE+' faylida xato:', err); return false; }
  items=items.filter(function(i){
    if(i.id==null){console.warn(CATALOG_FILE+': ID ko\'rsatilmagan qator o\'tkazib yuborildi:', i.name);return false;}
    return true;
  });
  if(!items.length)return false;

  var applied=(safeGetLS('parda_catalog_ids',null)||CATALOG_LEGACY_IDS).map(String);
  var catalogIds=items.map(function(i){return String(i.id);});
  var maxId=Math.max.apply(null,[0].concat(products.map(function(p){return Number(p.id)||0;}),items.map(function(i){return i.id;})));
  var next=[], remap={}, dropped={};

  products.forEach(function(p){
    var id=String(p.id);
    if(catalogIds.indexOf(id)!==-1&&applied.indexOf(id)===-1){
      // Xodimning o'z mahsuloti tasodifan katalogdagi ID bilan bir xil - unga yangi ID beramiz.
      var newId=++maxId; remap[id]=newId; next.push(Object.assign({},p,{id:newId}));
      return;
    }
    if(applied.indexOf(id)!==-1){ dropped[id]=p; return; } // standart mahsulot - katalogdagi qiymat bilan almashtiriladi
    next.push(p); // xodimning o'zi qo'shgan mahsulot
  });
  items.forEach(function(i){next.push({id:i.id,name:i.name,bolim:i.bolim,price:i.price,unit:i.unit});});

  // Eski standart mahsulotga bog'langan qatorlarni yangi ro'yxatdagi mahsulotga ulaymiz:
  //  - shu ID'da hali ham o'sha nomli mahsulot bo'lsa - o'zgarishsiz qoladi;
  //  - ID raqamlari qayta tartiblangan bo'lsa yoki takror o'chirilgan bo'lsa - NOMI va bo'limi bo'yicha topamiz;
  //  - nomi o'zgargan bo'lsa (ID o'sha) - o'sha ID'da qoladi.
  Object.keys(dropped).forEach(function(id){
    var key=catalogKey(dropped[id]);
    var sameId=next.find(function(p){return String(p.id)===id;});
    if(sameId&&catalogKey(sameId)===key)return;
    var sameName=next.find(function(p){return catalogKey(p)===key;});
    if(sameName)remap[id]=sameName.id;
    else if(!sameId)remap[id]=null; // butunlay o'chirilgan
  });
  if(Object.keys(remap).length){
    ['mahsulot','tikish','ustanovka'].forEach(function(t){
      (calcRows[t]||[]).forEach(function(r){var k=String(r.prodId);if(remap[k]!=null)r.prodId=remap[k];});
    });
    var usage={};
    Object.keys(productUsage).forEach(function(k){
      var target=Object.prototype.hasOwnProperty.call(remap,k)?remap[k]:k;
      if(target!=null)usage[target]=(usage[target]||0)+productUsage[k];
    });
    productUsage=usage;
  }

  var before=products;
  products=next;
  if(savePr()===false){products=before;return false;}
  saveCalc();saveUsage();
  safeSetLS('parda_catalog_ids',catalogIds.map(Number));
  safeSetLS('parda_catalog_hash',hash);
  return true;
}

function fetchDefaultCatalog(){
  return fetch(CATALOG_FILE,{cache:'no-cache'}).then(function(r){return r.ok?r.text():null;}).catch(function(){return null;});
}

// Ilova ishga tushganda startup.js oldindan yuklab qo'ygan matnni qo'llaymiz.
syncDefaultCatalog(window.__defaultCatalogText);
delete window.__defaultCatalogText;

// Ilova telefonda kunlab ochiq turishi mumkin - orqa fondan qaytganda ham tekshiramiz.
(function(){
  var last=Date.now();
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState!=='visible'||Date.now()-last<60000)return;
    last=Date.now();
    fetchDefaultCatalog().then(function(text){
      if(!syncDefaultCatalog(text))return;
      if(typeof renderProdList==='function')renderProdList();
      if(typeof renderAllRows==='function')renderAllRows();
      showSnack('🔄 Katalog narxlari yangilandi');
    });
  });
})();
