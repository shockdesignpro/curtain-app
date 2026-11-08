// ============================================================
// MAKROS.JS — "Xarajatlar" bo'limiga bir bosishda bir nechta mahsulot
// qo'shadigan makroslar (Baget, Potolok karniz).
//
//  - Makros tarkibi Sozlamalar → Makroslar bo'limida o'zgartiriladi:
//    nomi, biriktirilgan mahsulotlar (qo'shish / olib tashlash).
//  - Buyurtma kiritayotganda Xarajatlar sarlavhasi yonidagi tugma bosilsa,
//    makrosdagi mahsulotlar tanlangan xona/derazaga miqdori BO'SH holda qo'shiladi.
//  - Mahsulot ID'si katalog yangilanganda o'zgarishi mumkin, shuning uchun
//    nomi ham saqlanadi va mahsulot nom bo'yicha qayta topiladi.
// ============================================================

var MACRO_DEFAULTS=[
  {id:'baget', name:'Baget'},
  {id:'potolok', name:'Potolok karniz'}
];

function sanitizeMacros(list){
  var saved=Array.isArray(list)?list:[];
  return MACRO_DEFAULTS.map(function(d){
    var s=saved.find(function(m){return m&&m.id===d.id;})||{};
    var seen={};
    var items=(Array.isArray(s.items)?s.items:[]).filter(function(i){
      if(!i||typeof i!=='object')return false;
      var id=Number(i.prodId),key=String(i.name||'').trim();
      if(!key||seen[key])return false;
      seen[key]=true;return true;
    }).map(function(i){var id=Number(i.prodId);return {prodId:Number.isSafeInteger(id)&&id>0?id:0,name:String(i.name).trim()};});
    var name=String(s.name==null?'':s.name).trim().slice(0,40);
    return {id:d.id, name:name||d.name, items:items};
  });
}
var macros=sanitizeMacros(safeGetLS('parda_macros',null));
function saveMacros(){return safeSetLS('parda_macros',macros);}
function findMacro(id){return macros.find(function(m){return m.id===id;});}

// Biriktirilgan mahsulotni katalogdan topadi: avval ID+nom, keyin nom, keyin faqat ID.
function macroProduct(item){
  var pool=products.filter(function(p){return p.bolim==='mahsulot';});
  var byId=pool.find(function(p){return p.id===item.prodId;});
  if(byId&&byId.name===item.name)return byId;
  return pool.find(function(p){return p.name===item.name;})||byId||null;
}

// ---- XARAJATLAR BO'LIMIDAGI TUGMALAR ----
function renderMacroButtons(){
  var el=document.getElementById('macro-buttons');
  if(!el)return;
  el.innerHTML=macros.map(function(m){
    return '<button type="button" class="macro-btn" onclick="applyMacro(\''+m.id+'\')" title="'+esc(m.name)+' makrosi: '+m.items.length+' ta mahsulot">'
      +icon('plus',14)+'<span>'+esc(m.name)+'</span></button>';
  }).join('');
}
function applyMacro(id){
  var m=findMacro(id);
  if(!m)return;
  var list=m.items.map(macroProduct).filter(Boolean);
  if(!list.length){
    showSnack('“'+m.name+'” makrosiga mahsulot biriktirilmagan. Sozlamalar → Makroslar bo‘limidan qo‘shing');
    return;
  }
  var roomId=currentCostRoom(),pardaId=currentCostParda(),firstId=rowCnt+1;
  list.forEach(function(p){
    calcRows.mahsulot.push({id:++rowCnt,prodId:p.id,miqdor:null,roomId:roomId,costPardaId:pardaId,price:p.price});
  });
  saveCalc();renderSection('mahsulot');recalc();
  var first=document.getElementById('calc-mahsulot-'+firstId);
  if(first&&first.scrollIntoView)first.scrollIntoView({behavior:'smooth',block:'center'});
  var missing=m.items.length-list.length;
  showSnack('⚡ '+m.name+': '+list.length+' ta mahsulot qo‘shildi — miqdorlarini kiriting'+(missing?' ('+missing+' tasi katalogda topilmadi)':''));
}

// ---- SOZLAMALAR → MAKROSLAR ----
function renderMacroSettings(){
  var el=document.getElementById('macro-settings');
  if(!el)return;
  var pool=products.filter(function(p){return p.bolim==='mahsulot';}).sort(productAlphabetical);
  el.innerHTML=macros.map(function(m){
    var attachedIds=[];
    var rows=m.items.map(function(item,idx){
      var p=macroProduct(item);
      if(p)attachedIds.push(p.id);
      return '<li class="macro-item'+(p?'':' macro-item-missing')+'">'
        +'<span class="macro-item-text"><strong>'+esc(p?p.name:item.name)+'</strong>'
        +'<small>'+(p?fmt(p.price)+' / '+esc(p.unit):'Katalogda topilmadi — olib tashlang yoki katalogga qo‘shing')+'</small></span>'
        +'<button type="button" class="del-btn" aria-label="'+esc((p?p.name:item.name)+' mahsulotini makrosdan olib tashlash')+'" onclick="removeMacroItem(\''+m.id+'\','+idx+')">'+icon('close',16)+'</button>'
      +'</li>';
    }).join('');
    var free=pool.filter(function(p){return attachedIds.indexOf(p.id)===-1;});
    return '<div class="card macro-card">'
      +'<div class="macro-card-head"><span class="macro-badge">'+icon('plus',14)+'</span><h3>'+esc(m.name)+'</h3><span class="macro-count">'+m.items.length+' ta</span></div>'
      +'<label for="macro-name-'+m.id+'">Tugma nomi</label>'
      +'<input id="macro-name-'+m.id+'" class="fi" type="text" maxlength="40" value="'+esc(m.name)+'" onchange="renameMacro(\''+m.id+'\',this.value)">'
      +'<div class="macro-subtitle">Biriktirilgan mahsulotlar</div>'
      +(rows?'<ul class="macro-items">'+rows+'</ul>':'<p class="input-note macro-empty">Hali mahsulot biriktirilmagan.</p>')
      +(free.length
        ?'<div class="macro-add"><label for="macro-add-'+m.id+'" class="sr-only">Biriktiriladigan mahsulot</label>'
          +'<select id="macro-add-'+m.id+'">'+free.map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+' · '+fmtN(p.price)+'</option>';}).join('')+'</select>'
          +'<button type="button" class="add-row-btn arb-teal" onclick="addMacroItem(\''+m.id+'\')">＋ Biriktirish</button></div>'
        :'<p class="input-note">Katalogdagi barcha mahsulotlar biriktirilgan.</p>')
    +'</div>';
  }).join('');
}
function macroChanged(){
  if(!saveMacros())return false;
  renderMacroSettings();renderMacroButtons();
  return true;
}
function addMacroItem(id){
  var m=findMacro(id),sel=document.getElementById('macro-add-'+id);
  if(!m||!sel)return;
  var p=products.find(function(x){return String(x.id)===sel.value;});
  if(!p)return;
  m.items.push({prodId:p.id,name:p.name});
  if(macroChanged())showSnack('✅ “'+p.name+'” '+m.name+' makrosiga biriktirildi');
}
function removeMacroItem(id,idx){
  var m=findMacro(id);
  if(!m||!m.items[idx])return;
  var removed=m.items.splice(idx,1)[0];
  if(!macroChanged())return;
  showUndoSnack('“'+removed.name+'” '+m.name+' makrosidan olib tashlandi',function(){
    m.items.splice(Math.min(idx,m.items.length),0,removed);
    macroChanged();
  });
}
function renameMacro(id,val){
  var m=findMacro(id);
  if(!m)return;
  var def=MACRO_DEFAULTS.find(function(d){return d.id===id;});
  m.name=String(val||'').trim().slice(0,40)||def.name;
  if(macroChanged())showSnack('✅ Makros nomi saqlandi: '+m.name);
}

// ---- HAMMAGA TARQATISH: Lobar-makroslar.csv ----
// Egasi Sozlamalar → Makroslar → "Eksport" orqali faylni olib, GitHub'ga yuklaydi.
// Har bir telefon ilova ochilganda (va orqa fondan qaytganda) faylni tekshiradi;
// fayl o'zgargan bo'lsa, makroslar shu fayl bo'yicha yangilanadi.
// Fayl hali yuklanmagan bo'lsa (404) - telefondagi makroslar o'zgarmaydi.
var MACROS_FILE='Lobar-makroslar.csv';
var MACROS_HEADER=['Makros','Tugma nomi','Mahsulot'];

function macrosCSV(){
  function cell(v){v=String(v==null?'':v);if(/^[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
  var rows=[MACROS_HEADER];
  macros.forEach(function(m){
    if(!m.items.length){rows.push([m.id,m.name,'']);return;}
    m.items.forEach(function(item){var p=macroProduct(item);rows.push([m.id,m.name,p?p.name:item.name]);});
  });
  return '﻿'+rows.map(function(r){return r.map(cell).join(';');}).join('\r\n')+'\r\n';
}
function parseMacrosCSV(text){
  var rows=parseCSVRows(text);
  if(!rows.length||rows.shift().map(function(v){return v.trim();}).join('|')!==MACROS_HEADER.join('|'))
    throw new Error('Ustunlar: '+MACROS_HEADER.join(';'));
  var found={};
  rows.forEach(function(r,i){
    r=r.map(function(v){return String(v||'').trim().replace(/^'(?=[=+@-])/,'');});
    var key=r[0].toLocaleLowerCase();
    var def=MACRO_DEFAULTS.find(function(d){return d.id===key||d.name.toLocaleLowerCase()===key;});
    if(!def)throw new Error((i+2)+'-qator: makros “'+r[0]+'” noma’lum (baget yoki potolok bo‘lishi kerak)');
    var m=found[def.id]||(found[def.id]={id:def.id,name:'',items:[]});
    if(!m.name&&r[1])m.name=r[1];
    if(r[2]){
      var p=products.find(function(x){return x.bolim==='mahsulot'&&x.name===r[2];});
      m.items.push({prodId:p?p.id:0,name:r[2]});
    }
  });
  return found;
}
function syncSharedMacros(text){
  if(typeof text!=='string'||!text.trim())return false;
  var hash=catalogHash(text);
  if(safeGetLS('parda_macros_hash',null)===hash)return false;
  var found;
  try{found=parseMacrosCSV(text);}
  catch(err){console.error(MACROS_FILE+' faylida xato:',err);return false;}
  var next=sanitizeMacros(macros.map(function(m){return found[m.id]||m;}));
  var before=macros;macros=next;
  if(!saveMacros()){macros=before;return false;}
  safeSetLS('parda_macros_hash',hash);
  renderMacroButtons();
  if(window.settingsSection==='macros')renderMacroSettings();
  return true;
}
function fetchSharedMacros(){
  return fetch(MACROS_FILE,{cache:'no-cache'}).then(function(r){return r.ok?r.text():null;}).catch(function(){return null;});
}
function exportMacros(){
  var url=URL.createObjectURL(new Blob([macrosCSV()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download=MACROS_FILE;a.click();setTimeout(function(){URL.revokeObjectURL(url);},4000);
}

renderMacroButtons();
fetchSharedMacros().then(syncSharedMacros);
(function(){
  var last=Date.now();
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState!=='visible'||Date.now()-last<60000)return;
    last=Date.now();
    fetchSharedMacros().then(function(text){if(syncSharedMacros(text))showSnack('🔄 Makroslar yangilandi');});
  });
})();
