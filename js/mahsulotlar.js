function productAlphabetical(a,b){return String(a.name||'').localeCompare(String(b.name||''),'uz',{sensitivity:'base',numeric:true});}
// ============================================================
// MAHSULOTLAR.JS — mahsulotlar ro'yxati, drawer, qo'shish/tahrirlash modali
// ============================================================

// ---- DRAWER ----
function openDrawer(){
  setFilter(filterVal);renderProdList();
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-ov').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-ov').classList.remove('open');
  document.body.style.overflow='';
}

// ---- FILTER ----
function setFilter(f){
  filterVal=f;
  document.querySelectorAll('[data-f]').forEach(function(c){
    c.classList.toggle('selected',c.dataset.f===f);
    c.setAttribute('aria-pressed',String(c.dataset.f===f));
  });
  renderProdList();
}

// ---- PRODUCT LIST ----
// 1-band: qidiruv maydoni bo'yicha filtrlash (debounce bilan, tarix qidiruviga o'xshab)
function renderProdList(){
  var list=document.getElementById('prod-list');
  var empty=document.getElementById('prod-empty');
  var searchEl=document.getElementById('prod-search');
  var q=(searchEl?searchEl.value:'').trim().toLowerCase();
  var base=filterVal==='all'?products:products.filter(function(p){return p.bolim===filterVal;});
  base=base.slice().sort(productAlphabetical);
  var filtered = q ? base.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1;}) : base;
  if(!filtered.length){
    list.innerHTML='';
    empty.style.display='block';
    empty.querySelector('p').innerHTML = q
      ? "\""+esc(searchEl.value.trim())+"\" bo'yicha hech narsa topilmadi."
      : "Mahsulotlar yo'q.<br/>Yuqoridagi tugmani bosing.";
    return;
  }
  empty.style.display='none';
  var groups={};
  filtered.forEach(function(p){if(!groups[p.bolim])groups[p.bolim]=[];groups[p.bolim].push(p);});
  var titles={mahsulot:'📦 Mahsulotlar',tikish:'✂️ Tikish narxlari',ustanovka:"🔧 O'rnatish narxlari"};
  var bclass={mahsulot:'bm',tikish:'bt',ustanovka:'bu'};
  var init={mahsulot:'M',tikish:'T',ustanovka:'O'};
  var html='';
  Object.keys(groups).forEach(function(b){
    html+='<section class="catalog-group"><div class="catalog-heading"><h3>'+titles[b]+'</h3><span>'+groups[b].length+' ta</span></div><div class="catalog-items">';
    groups[b].forEach(function(p){
      html+='<div class="prod-item">'
        +'<div class="prod-badge '+bclass[b]+'">'+init[b]+'</div>'
        +'<div class="prod-info">'
          +'<div class="prod-name">'+esc(p.name)+'</div>'
          +'<div class="prod-meta"><strong>'+fmtN(p.price)+" so‘m</strong><span> / "+esc(p.unit)+'</span></div>'
        +'</div>'
        +'<button aria-label="Mahsulotni tahrirlash" class="btn-icon" onclick="editProduct('+p.id+')">'+icon('edit',15)+'</button>'
        +'<button aria-label="Mahsulotni o‘chirish" class="btn-icon" onclick="deleteProduct('+p.id+')">'+icon('trash',15)+'</button>'
      +'</div>';
    });
    html+='</div></section>';
  });
  list.innerHTML=html;
}
var renderProdListDebounced = debounce(renderProdList, 200);

// ---- MODAL ----
function openAddModal(){
  editingId=null;
  document.getElementById('modal-title').textContent="Yangi mahsulot qo'shish";
  document.getElementById('prod-name-input').value='';
  document.getElementById('prod-price-input').value='';
  document.getElementById('prod-unit').value='m';
  selectBolim('mahsulot');
  document.getElementById('add-modal').classList.add('open');
}
function editProduct(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  editingId=id;
  document.getElementById('modal-title').textContent='Mahsulotni tahrirlash';
  document.getElementById('prod-name-input').value=p.name;
  document.getElementById('prod-price-input').value=p.price;
  document.getElementById('prod-unit').value=p.unit;
  selectBolim(p.bolim);
  document.getElementById('add-modal').classList.add('open');
}
function selectBolim(b){
  selectedBolim=b;
  var map={mahsulot:'bc-m',tikish:'bc-t',ustanovka:'bc-u'};
  ['mahsulot','tikish','ustanovka'].forEach(function(x){
    var c=document.getElementById('chip-'+x);
    c.className='bolim-chip';
    if(x===b)c.className='bolim-chip '+map[x];
  });
}
function closeModal(){document.getElementById('add-modal').classList.remove('open');}
function saveProduct(){
  var name=document.getElementById('prod-name-input').value.trim();
  var price=calcNumber(document.getElementById('prod-price-input').value);
  if(price===null){showSnack('Narxni to‘g‘ri kiriting. Masalan: 60 000');return;}
  var unit=document.getElementById('prod-unit').value;
  if(!name){showSnack('Nom kiriting!');return;}
  if(editingId){
    var p=products.find(function(x){return x.id===editingId;});
    if(p){p.name=name;p.price=price;p.unit=unit;p.bolim=selectedBolim;}
    showSnack('✅ Yangilandi');
  } else {
    var newId=products.length?Math.max.apply(null,products.map(function(p){return p.id;}))+1:1;
    products.push({id:newId,name:name,bolim:selectedBolim,price:price,unit:unit});
    showSnack("✅ Qo'shildi");
  }
  savePr();closeModal();renderProdList();renderAllRows();
}
// 7-band: darhol o'chiradi, lekin bir necha soniya "BEKOR QILISH" bilan tiklash imkonini beradi
function deleteProduct(id){
  var idx=products.findIndex(function(p){return p.id===id;});
  if(idx===-1)return;
  var removed=products[idx];
  products=products.filter(function(p){return p.id!==id;});
  savePr();renderProdList();renderAllRows();
  showUndoSnack("🗑️ \""+removed.name+"\" o'chirildi", function(){
    products.splice(Math.min(idx,products.length),0,removed);
    savePr();renderProdList();renderAllRows();
    showSnack('↩️ Tiklandi');
  });
}

function catalogCSV(){
 function cell(v){v=String(v==null?'':v);if(/^[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
 return '\ufeff'+[['ID','Nomi','Bolim','Narx','Birlik']].concat(products.slice().sort(productAlphabetical).map(function(p){return [p.id,p.name,p.bolim,p.price,p.unit];})).map(function(r){return r.map(cell).join(';');}).join('\r\n');
}
function parseCatalogCSV(text){
 text=text.replace(/^\ufeff/,'');var delimiter=text.split(/\r?\n/)[0].includes(';')?';':',',rows=[],row=[],value='',quoted=false;
 for(var i=0;i<text.length;i++){var c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===delimiter||c==='\n'||c==='\r')){row.push(value);value='';if(c!==delimiter){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(function(v){return v.trim();}))rows.push(row);row=[];}}else value+=c;}
 if(quoted)throw new Error('CSV qo‘shtirnoqlari yopilmagan');row.push(value);if(row.some(function(v){return v.trim();}))rows.push(row);
 if(!rows.length||rows.shift().join('|')!=='ID|Nomi|Bolim|Narx|Birlik')throw new Error('Ustunlar: ID;Nomi;Bolim;Narx;Birlik');
 var seen={};return rows.map(function(r,i){
  if(r.length!==5)throw new Error((i+2)+'-qator: 5 ta ustun kerak');
  r=r.map(function(v){return v.trim().replace(/^'(?=[=+@-])/,'');});var price=Number(r[3].replace(/\s/g,'').replace(',','.'));
  if(!r[1]||!r[4]||!['mahsulot','tikish','ustanovka'].includes(r[2])||!r[3]||!Number.isFinite(price)||price<0)throw new Error((i+2)+'-qator ma’lumotlari noto‘g‘ri');
  if(r[0]&&(!/^\d+$/.test(r[0])||!Number.isSafeInteger(Number(r[0]))||seen[r[0]]))throw new Error((i+2)+'-qator: ID noto‘g‘ri yoki takrorlangan');
  if(r[0])seen[r[0]]=true;
  return {id:r[0]?Number(r[0]):null,name:r[1],bolim:r[2],price:price,unit:r[4]};
 });
}
function mergeCatalog(items){
 var result=products.map(function(p){return Object.assign({},p);}),max=Math.max(0,...result.map(function(p){return Number(p.id)||0;}),...items.map(function(p){return p.id||0;}));
 items.forEach(function(p){var existing=result.find(function(x){return String(x.id)===String(p.id);});if(existing)Object.assign(existing,p);else result.push(Object.assign({},p,{id:p.id==null?++max:p.id}));});return result;
}
function exportCatalog(){var url=URL.createObjectURL(new Blob([catalogCSV()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Lobar-katalog.csv';a.click();setTimeout(function(){URL.revokeObjectURL(url);},4000);}
async function importCatalog(files){
 if(!files||!files.length)return;
 try{if(files[0].size>5*1024*1024)throw new Error('CSV fayli 5 MB dan kichik bo‘lsin');var items=parseCatalogCSV(await files[0].text());if(!items.length)throw new Error('CSV bo‘sh');
 if(!await showConfirm(items.length+' ta katalog qatorini import qilamizmi? Mavjud IDlar yangilanadi.',{okText:'Import'}))return;
 var merged=mergeCatalog(items);if(!safeSetLS('parda_products',merged))return;products=merged;
 if(window.NativeBridge&&NativeBridge.isNative)await NativeBridge.flush();renderProdList();renderAllRows();showSnack('Katalog import qilindi');
 }catch(e){showSnack(e.message||'Import bajarilmadi');}finally{document.getElementById('catalog-file').value='';}
}
