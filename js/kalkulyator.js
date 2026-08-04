// ============================================================
// KALKULYATOR.JS — hisob qatorlari (mahsulot/tikish/o'rnatish),
// tezkor qo'shish (eng ko'p ishlatilgan), summalar
// ============================================================

function addCalcRow(type){
  var prods=products.filter(function(p){return p.bolim===type;});
  if(!prods.length){showSnack("Avval mahsulot qo'shing!");return;}
  var id=++rowCnt;
  calcRows[type].push({id:id,prodId:prods[0].id,miqdor:1});
  saveCalc();renderSection(type);recalc();
}
function quickAddRow(type,prodId){
  var prod=products.find(function(p){return p.id===prodId;});
  if(!prod)return;
  var id=++rowCnt;
  calcRows[type].push({id:id,prodId:prodId,miqdor:1});
  saveCalc();renderSection(type);recalc();
  showSnack('✅ '+prod.name+" qo'shildi");
}
function removeCalcRow(type,id){
  calcRows[type]=calcRows[type].filter(function(r){return r.id!==id;});
  saveCalc();renderSection(type);recalc();
}

// ---- ENG KO'P ISHLATILGAN MAHSULOTLAR (tezkor qo'shish) ----
function bumpUsage(prodId){
  productUsage[prodId]=(productUsage[prodId]||0)+1;
}
function topProducts(type,n){
  return products.filter(function(p){return p.bolim===type&&(productUsage[p.id]||0)>0;})
    .sort(function(a,b){return (productUsage[b.id]||0)-(productUsage[a.id]||0);})
    .slice(0,n);
}
function renderQuickAdd(type){
  var cont=document.getElementById(type+'-quick');
  if(!cont)return;
  var top=topProducts(type,4);
  if(!top.length){cont.innerHTML='';return;}
  cont.innerHTML=top.map(function(p){
    return '<div class="chip" onclick="quickAddRow(\''+type+'\','+p.id+')">⚡ '+esc(p.name)+'</div>';
  }).join('');
}
function renderSection(type){
  var cont=document.getElementById(type+'-rows');
  if(!cont)return;
  var prods=products.filter(function(p){return p.bolim===type;});
  if(!prods.length){
    cont.innerHTML='<p style="font-size:12px;color:var(--muted);padding:6px 0 4px;">Bu bo\'limda mahsulot yo\'q.</p>';
    return;
  }
  cont.innerHTML=calcRows[type].map(function(row){
    var opts=prods.map(function(p){
      return '<option value="'+p.id+'"'+(p.id===row.prodId?' selected':'')+'>'+esc(p.name)+'</option>';
    }).join('');
    var prod=prods.find(function(p){return p.id===row.prodId;})||prods[0];
    var price=prod?prod.price:0;
    var sum=row.miqdor*price;
    return '<div class="calc-row">'
      +'<select onchange="onSel(\''+type+'\','+row.id+',this.value)">'+opts+'</select>'
      +'<input class="price-input" type="text" inputmode="decimal" value="'+price+'"'
        +' onblur="onPrice(\''+type+'\','+row.id+',this.value)"'
        +' onchange="onPrice(\''+type+'\','+row.id+',this.value)"/>'
      +'<input class="mq-input" type="text" inputmode="decimal" value="'+row.miqdor+'"'
        +' onblur="onMq(\''+type+'\','+row.id+',this.value)"'
        +' onchange="onMq(\''+type+'\','+row.id+',this.value)"/>'
      +'<span class="row-sum">'+fmtN(sum)+'</span>'
      +'<button class="del-btn" onclick="removeCalcRow(\''+type+'\','+row.id+')">✕</button>'
    +'</div>';
  }).join('');
}
function renderAllRows(){
  renderSection('mahsulot');renderSection('tikish');renderSection('ustanovka');
  renderQuickAdd('mahsulot');renderQuickAdd('tikish');renderQuickAdd('ustanovka');
  recalc();
}
function onSel(type,id,val){
  var row=calcRows[type].find(function(r){return r.id===id;});
  if(row){row.prodId=parseInt(val);saveCalc();renderSection(type);recalc();}
}
function onMq(type,id,val){
  var row=calcRows[type].find(function(r){return r.id===id;});
  if(row){
    row.miqdor=Math.max(0,parseMq(val));
    if(row.linkParda)row.autoSync=false; // qo'lda o'zgartirilsa, avtomatik sinxronlash to'xtaydi
    saveCalc();renderSection(type);recalc();
  }
}
function onPrice(type,id,val){
  var row=calcRows[type].find(function(r){return r.id===id;});
  if(!row)return;
  var prod=products.find(function(p){return p.id===row.prodId;});
  if(!prod)return;
  prod.price=Math.max(0,parsePrice(val));
  savePr();renderSection(type);recalc();
}

function getSum(type){
  return calcRows[type].reduce(function(s,r){
    var p=products.find(function(x){return x.id===r.prodId;});
    return s+r.miqdor*(p?p.price:0);
  },0);
}

function recalc(){
  var mS=getSum('mahsulot'),tS=getSum('tikish'),uS=getSum('ustanovka');
  var xizmat=tS+uS,grand=mS+xizmat;
  var ids=['mahsulot-subtotal','tikish-subtotal','ustanovka-subtotal',
           't-mahsulot','t-tikish','t-ustanovka','t-xizmat','t-grand'];
  var vals=[mS,tS,uS,mS,tS,uS,xizmat,grand];
  ids.forEach(function(id,i){
    var el=document.getElementById(id);
    if(el)el.textContent=fmt(vals[i]);
  });
}

// ---- HISOB DETAIL (Hisob sahifasidagi batafsil ro'yxat) ----
function renderDetailSummary(){
  var types=['mahsulot','tikish','ustanovka'];
  var colors={mahsulot:'var(--teal)',tikish:'var(--amber)',ustanovka:'var(--purple)'};
  types.forEach(function(type){
    var card=document.getElementById('summary-'+type+'-detail');
    var det=document.getElementById('detail-'+type);
    if(!card||!det)return;
    var rows=calcRows[type];
    if(!rows.length){card.style.display='none';return;}
    card.style.display='block';
    det.innerHTML=rows.map(function(row){
      var prod=products.find(function(p){return p.id===row.prodId;});
      var name=prod?prod.name:'?';
      var price=prod?prod.price:0;
      var sum=row.miqdor*price;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
        +'<span style="flex:1;color:var(--text);">'+esc(name)+'</span>'
        +'<span style="color:var(--muted);width:64px;text-align:center;">'+fmtN(price)+'</span>'
        +'<span style="color:var(--muted);width:40px;text-align:center;">×'+row.miqdor+'</span>'
        +'<span style="font-weight:800;width:78px;text-align:right;">'+fmtN(sum)+'</span>'
        +'</div>';
    }).join('')
    +'<div style="display:flex;justify-content:space-between;padding:7px 0 0;font-size:12px;font-weight:800;">'
      +'<span>Jami:</span><span style="color:'+colors[type]+'">'+fmt(getSum(type))+'</span>'
    +'</div>';
  });
}

// ---- SAQLASH SAHIFASI OLDINDAN KO'RISH ----
function renderSaqlash(){
  var ism=document.getElementById('mijoz-ism').value||'—';
  var manzil=document.getElementById('mijoz-manzil').value||'—';
  var tel=document.getElementById('mijoz-tel').value||'—';
  var mS=getSum('mahsulot'),tS=getSum('tikish'),uS=getSum('ustanovka');
  var xizmat=tS+uS,grand=mS+xizmat;
  document.getElementById('preview-client').innerHTML=
    '<b>👤 Mijoz:</b> '+esc(ism)+'<br>'
    +'<b>📍 Manzil:</b> '+esc(manzil)+'<br>'
    +'<b>📞 Tel:</b> '+esc(tel);
  document.getElementById('preview-totals').innerHTML=
    '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid var(--border);">'
      +'<span style="color:var(--muted);">📦 Harajatlar</span><span style="font-weight:800;">'+fmt(mS)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid var(--border);">'
      +'<span style="color:var(--muted);">✂️ Tikish</span><span style="font-weight:800;">'+fmt(tS)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid var(--border);">'
      +'<span style="color:var(--muted);">🔧 O\'rnatish</span><span style="font-weight:800;">'+fmt(uS)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:6px 8px;font-size:13px;background:var(--teal-light);border-radius:8px;margin-top:6px;">'
      +'<span style="color:var(--teal);font-weight:800;">Xizmat haqi jami</span><span style="font-weight:800;color:var(--teal);">'+fmt(xizmat)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:10px 0 2px;font-size:16px;font-weight:800;border-top:2px solid var(--teal);margin-top:8px;">'
      +'<span>💰 JAMI</span><span style="color:var(--teal);">'+fmt(grand)+'</span></div>';
}
