// ============================================================
// UTILS.JS — umumiy yordamchi funksiyalar (formatlash, xavfsiz
// localStorage o'qish/yozish, debounce, snack xabari)
// Bu fayl boshqa barcha js fayllardan OLDIN yuklanishi shart,
// chunki ularning barchasi shu yerdagi funksiyalarga tayanadi.
// ============================================================

// ---- XAVFSIZ LOCALSTORAGE (7-qadam: try/catch) ----
// localStorage to'lib qolishi (quota exceeded), xususiy(incognito)
// rejim yoki buzilgan JSON holatlarida ilova qulab tushmasligi uchun.
function safeGetLS(key, fallback){
  try{
    var raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    return JSON.parse(raw);
  }catch(err){
    console.error('safeGetLS xatosi ('+key+'):', err);
    return fallback;
  }
}
function safeSetLS(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }catch(err){
    console.error('safeSetLS xatosi ('+key+'):', err);
    // Eng ko'p uchraydigan sabab: xotira to'lib qolgan (rasmlar ko'p)
    if(err && (err.name === 'QuotaExceededError' || err.code === 22)){
      showSnack("⚠️ Xotira to'lib qoldi! Andoza rasmlarini kamaytiring yoki zaxira olib, eskilarini o'chiring.");
    } else {
      showSnack("⚠️ Ma'lumotni saqlashda xatolik yuz berdi");
    }
    return false;
  }
}

// ---- SON FORMATLASH ----
// fmtN — faqat raqam ("1 234"), fmt — "so'm" bilan ("1 234 so'm")
function fmtN(n){
  var rounded = Math.round(n) || 0;
  var s = Math.abs(rounded).toString();
  var result = '';
  var count = 0;
  for(var i = s.length - 1; i >= 0; i--){
    if(count > 0 && count % 3 === 0) result = ' ' + result;
    result = s[i] + result;
    count++;
  }
  return (rounded < 0 ? '-' : '') + result;
}
function fmt(n){
  return fmtN(n) + " so'm";
}

// ---- ESKAPE / PARSE ----
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseMq(v){return parseFloat(String(v).trim().replace(',','.'))||0;}
function parsePrice(v){return parseFloat(String(v).trim().replace(/\s+/g,'').replace(',','.'))||0;}
function normPhone(v){return String(v||'').replace(/\D/g,'');}

// ---- DEBOUNCE (6-qadam) ----
// Foydalanuvchi yozishni tugatgandan (odatda 250ms) so'nggina
// funksiyani chaqiradi — har bir tugma bosilishida emas.
function debounce(fn, delay){
  var timer = null;
  return function(){
    var args = arguments, ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function(){ fn.apply(ctx, args); }, delay);
  };
}

// ---- SNACK (pastki bildirishnoma) ----
function showSnack(msg){
  var s=document.getElementById('snack');
  if(!s)return;
  s.textContent=msg;s.classList.add('show');
  clearTimeout(showSnack._t);
  showSnack._t = setTimeout(function(){ s.classList.remove('show'); },2400);
}
