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
  if(authPreferences().disabled){hideLock();return;}
  var ov=document.getElementById('lock-ov');
  if(!ov)return;
  ov.classList.remove('hidden');
  var inp=document.getElementById('lock-pin-input');
  if(inp){ inp.value=''; setTimeout(function(){ var intro=document.getElementById('brand-intro');if(!intro||intro.hidden)inp.focus(); }, 150); }
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
    if(hash===(authPreferences().hash||PIN_HASH)){
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
document.addEventListener('parda:ready', function(){
  var inp=document.getElementById('lock-pin-input');
  if(inp){
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter') tryUnlock(); });
  }
  if(isUnlocked()) hideLock(); else showLock();
});

function authPreferences(){try{return JSON.parse(localStorage.getItem('parda_auth')||'{}')||{};}catch(e){return {};}}
async function updateAppPassword(remove){
 var prefs=authPreferences(),old=document.getElementById('settings-old-pin'),next=document.getElementById('settings-new-pin'),repeat=document.getElementById('settings-repeat-pin');
 if(!prefs.disabled&&(await sha256Hex(old.value))!==(prefs.hash||PIN_HASH)){showSnack('Joriy parol noto‘g‘ri');return;}
 if(!remove&&(!/^\d{4,12}$/.test(next.value)||next.value!==repeat.value)){showSnack('Yangi parol 4–12 raqamdan iborat va ikki maydonda bir xil bo‘lsin');return;}
 var value=remove?{disabled:true}:{disabled:false,hash:await sha256Hex(next.value)};
 if(!safeSetLS('parda_auth',value))return;
 if(window.NativeBridge&&NativeBridge.isNative)await NativeBridge.flush();
 old.value='';next.value='';repeat.value='';showSnack(remove?'Kirish paroli o‘chirildi':'Yangi parol saqlandi');
}
