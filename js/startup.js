(async function(){
  try{
    await window.NativeBridge.ready;
    // Standart mahsulotlar katalogini skriptlardan oldin olamiz (catalog-sync.js qo'llaydi).
    try{
      var res=await fetch('Lobar-katalog.csv',{cache:'no-cache'});
      window.__defaultCatalogText=res.ok?await res.text():null;
    }catch(e){window.__defaultCatalogText=null;}
    for(const src of ["js/vendor/html2canvas.min.js","js/auth.js","js/utils.js","js/ui.js","js/state.js","js/mijoz.js","js/mahsulotlar.js","js/catalog-sync.js","js/xona.js","js/andoza.js","js/kalkulyator.js","js/chek.js","js/tarix.js","js/backup.js","js/room-costs.js","js/main.js","js/mobile.js","js/settings-intro.js","js/makros.js","js/settings.js","js/compact-select.js"]){
      await new Promise(function(resolve,reject){
        var script=document.createElement('script');
        script.src=src;script.onload=resolve;script.onerror=function(){reject(new Error(src));};
        document.body.appendChild(script);
      });
    }
    await window.NativeBridge.attach();
    document.dispatchEvent(new Event('parda:ready'));
  }catch(error){
    console.error(error);
    var text=document.querySelector('.lock-sub');
    if(text)text.textContent='Ilovani yuklashda xatolik. Qayta ochib ko‘ring.';
  }
})();
