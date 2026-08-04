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
    c.style.cssText='';
    if(c.dataset.f===f){
      if(f==='all'||f==='mahsulot'){c.style.borderColor='var(--teal)';c.style.background='var(--teal-light)';c.style.color='var(--teal)';}
      else if(f==='tikish'){c.style.borderColor='var(--amber)';c.style.background='var(--amber-light)';c.style.color='#a06800';}
      else if(f==='ustanovka'){c.style.borderColor='var(--purple)';c.style.background='var(--purple-light)';c.style.color='var(--purple)';}
    }
  });
  renderProdList();
}

// ---- PRODUCT LIST ----
function renderProdList(){
  var list=document.getElementById('prod-list');
  var empty=document.getElementById('prod-empty');
  var filtered=filterVal==='all'?products:products.filter(function(p){return p.bolim===filterVal;});
  if(!filtered.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  var groups={};
  filtered.forEach(function(p){if(!groups[p.bolim])groups[p.bolim]=[];groups[p.bolim].push(p);});
  var titles={mahsulot:'📦 Mahsulotlar',tikish:'✂️ Tikish narxlari',ustanovka:"🔧 O'rnatish narxlari"};
  var bclass={mahsulot:'bm',tikish:'bt',ustanovka:'bu'};
  var init={mahsulot:'M',tikish:'T',ustanovka:'O'};
  var html='';
  Object.keys(groups).forEach(function(b){
    html+='<div style="font-size:11px;font-weight:800;color:var(--muted);margin:10px 0 6px;">'+titles[b]+'</div>';
    groups[b].forEach(function(p){
      html+='<div class="prod-item">'
        +'<div class="prod-badge '+bclass[b]+'">'+init[b]+'</div>'
        +'<div class="prod-info">'
          +'<div class="prod-name">'+esc(p.name)+'</div>'
          +'<div class="prod-meta">'+p.unit+' · '+fmtN(p.price)+" so'm"+'</div>'
        +'</div>'
        +'<button class="btn-icon" onclick="editProduct('+p.id+')">✏️</button>'
        +'<button class="btn-icon" onclick="deleteProduct('+p.id+')">🗑️</button>'
      +'</div>';
    });
  });
  list.innerHTML=html;
}

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
  var price=parseFloat(document.getElementById('prod-price-input').value)||0;
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
function deleteProduct(id){
  if(!confirm("O'chirishni tasdiqlaysizmi?"))return;
  products=products.filter(function(p){return p.id!==id;});
  savePr();renderProdList();renderAllRows();
  showSnack("🗑️ O'chirildi");
}
