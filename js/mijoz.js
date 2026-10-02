// ============================================================
// MIJOZ.JS — mijoz ma'lumotlari, telefon maydoni, tayyor bo'lish sanasi
// ============================================================

// ---- TAYYOR BO'LISH SANASI ----
function setTayyorDays(n){
  var d=new Date();
  d.setDate(d.getDate()+n);
  var iso=d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();
  document.getElementById('mijoz-tayyor-sana').value=iso;
  document.querySelectorAll('#tayyor-chips .chip').forEach(function(c){
    c.classList.toggle('active', c.dataset.days===String(n));
  });
  saveClient();
}
function onTayyorDateInput(){
  document.querySelectorAll('#tayyor-chips .chip').forEach(function(c){c.classList.remove('active');});
  saveClient();
}

// ---- PHONE FIELD (+998 fixed prefix) ----
var PHONE_PREFIX='+998';
function onPhoneInput(el, cb){
  var v=el.value;
  if(v.indexOf(PHONE_PREFIX)!==0){
    var digits=v.replace(/\D/g,'');
    if(digits.indexOf('998')===0) digits=digits.slice(3);
    v=PHONE_PREFIX+digits;
  }
  var rest=v.slice(PHONE_PREFIX.length).replace(/\D/g,'');
  if(rest.length>9) rest=rest.slice(0,9);
  el.value=PHONE_PREFIX+rest;
  var pos=el.value.length;
  el.setSelectionRange(pos,pos);
  if(cb)cb();
}
function onPhoneFocus(el){
  if(!el.value) el.value=PHONE_PREFIX;
  if(el.selectionStart<PHONE_PREFIX.length){
    el.setSelectionRange(el.value.length,el.value.length);
  }
}
function onPhoneKeydown(e){
  var el=e.target;
  if((e.key==='Backspace'||e.key==='Delete') && el.selectionStart<=PHONE_PREFIX.length && el.selectionEnd<=PHONE_PREFIX.length){
    e.preventDefault();
  }
}

function newClient(){
  var isEmpty = !clientData.ism && !(clientData.tel||'').replace(PHONE_PREFIX,'') && !rooms.length && !andozaImages.length && !calcRows.mahsulot.length && !calcRows.tikish.length && !calcRows.ustanovka.length;
  if(isEmpty){
    switchPage('mahsulotlar');
    document.getElementById('mijoz-ism').focus();
    return;
  }
  showConfirm("Yangi mijoz uchun boshlaymiz? Joriy kiritilgan ma'lumotlar (mijoz, xonalar, andozalar, hisob) tozalanadi.", {danger:true, okText:'Boshlash'}).then(function(ok){
    if(!ok)return;
    resetAllData();
    switchPage('mahsulotlar');
    showSnack('👤 Yangi mijoz');
  });
}
