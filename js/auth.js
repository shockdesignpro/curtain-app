// ============================================================
// AUTH.JS — oddiy UMUMIY PIN bilan kirish devori.
//
// DIQQAT (MUHIM): bu HAQIQIY xavfsizlik emas. Butun kod (shu jumladan
// pastdagi PIN_HASH) brauzerda ochiq turadi - kod bilishga qiziqqan
// odam parolni "hisoblab" topa oladi. Bu faqat TASODIFIY/notanish
// odamlarni chetlab o'tish uchun oddiy to'siq, xolos.
// Firebase ulanganda buni server tomonlama tekshiriladigan HAQIQIY
// login tizimiga (har kim uchun alohida) almashtiramiz.
//
// PAROLNI O'ZGARTIRISH: pastdagi konsolda shu buyruqni yozing:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YANGI_PAROL'))
//     .then(b=>console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
// Chiqqan qatorni PIN_HASH ga qo'ying.
// ============================================================
var PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // hozirgi parol: 1234

function sha256Hex(str){
  var enc = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', enc).then(function(buf){
    return Array.prototype.map.call(new Uint8Array(buf), function(b){
      return b.toString(16).padStart(2,'0');
    }).join('');
  });
}
// Bir marta kiritilgan parol shu brauzer TAB/SESSIYASI davomida amal qiladi
// (ilova butunlay yopib qayta ochilganda yana so'raladi).
function isUnlocked(){ return sessionStorage.getItem('parda_unlocked')==='1'; }
function hideLock(){
  var ov=document.getElementById('lock-ov');
  if(ov) ov.classList.add('hidden');
}
function showLock(){
  var ov=document.getElementById('lock-ov');
  if(!ov)return;
  ov.classList.remove('hidden');
  var inp=document.getElementById('lock-pin-input');
  if(inp){ inp.value=''; setTimeout(function(){ inp.focus(); }, 150); }
}
function tryUnlock(){
  var inp=document.getElementById('lock-pin-input');
  var err=document.getElementById('lock-err');
  var val=inp?inp.value:'';
  if(!val){ if(inp)inp.focus(); return; }
  if(typeof crypto==='undefined' || !crypto.subtle){
    // Juda eski brauzer - xavfsiz emas, lekin ilova butunlay ishlamay qolmasin
    if(err) err.textContent="⚠️ Brauzer qo'llab-quvvatlamaydi";
    return;
  }
  sha256Hex(val).then(function(hash){
    if(hash===PIN_HASH){
      sessionStorage.setItem('parda_unlocked','1');
      if(err) err.textContent='';
      hideLock();
    } else {
      if(err) err.textContent="❌ Parol noto'g'ri";
      if(inp){
        inp.classList.add('shake');
        inp.value='';
        setTimeout(function(){ inp.classList.remove('shake'); }, 400);
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', function(){
  var inp=document.getElementById('lock-pin-input');
  if(inp){
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter') tryUnlock(); });
  }
  if(isUnlocked()) hideLock(); else showLock();
});
