// ============================================================
// KALKULYATOR.JS — hisob qatorlari (mahsulot/tikish/o'rnatish),
// tezkor qo'shish (eng ko'p ishlatilgan), summalar
// ============================================================

function addCalcRow(type){
  var prods=products.filter(function(p){return p.bolim===type;}).sort(productAlphabetical);
  if(!prods.length){showSnack("Avval mahsulot qo'shing!");return;}
  var initial=type==='mahsulot'?(prods.find(function(p){return p.name.trim().toLocaleLowerCase()==='material';})||prods[0]):prods[0];
  var id=++rowCnt;
  calcRows[type].push({id:id,prodId:initial.id,miqdor:1,roomId:currentCostRoom(),costPardaId:currentCostParda(),price:initial.price});
  saveCalc();renderSection(type);recalc();
}
function quickAddRow(type,prodId){
  var prod=products.find(function(p){return p.id===prodId;});
  if(!prod)return;
  var id=++rowCnt;
  calcRows[type].push({id:id,prodId:prodId,miqdor:1,roomId:currentCostRoom(),costPardaId:currentCostParda(),price:prod.price});
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
    .slice(0,n).sort(productAlphabetical);
}
function renderQuickAdd(type){
  var cont=document.getElementById(type+'-quick');
  if(!cont)return;
  var top=topProducts(type,4);
  if(!top.length){cont.innerHTML='';return;}
  cont.innerHTML=top.map(function(p){
    return '<button type="button" class="chip" onclick="quickAddRow(\''+type+'\','+p.id+')">⚡ '+esc(p.name)+'</button>';
  }).join('');
}
function renderSection(type){
  var cont=document.getElementById(type+'-rows');
  if(!cont)return;
  var prods=products.filter(function(p){return p.bolim===type;}).sort(productAlphabetical);
  if(!prods.length){
    cont.innerHTML='<p style="font-size:14px;color:var(--muted);padding:6px 0 4px;">Bu bo\'limda mahsulot yo\'q.</p>';
    return;
  }
  cont.innerHTML=calcRows[type].filter(isCurrentCostRow).map(function(row){
    var opts=prods.map(function(p){
      return '<option value="'+p.id+'"'+(p.id===row.prodId?' selected':'')+'>'+esc(p.name)+'</option>';
    }).join('');
    var prod=prods.find(function(p){return p.id===row.prodId;})||prods[0];
    var price=costRowPrice(row);
    var sum=row.miqdor*price;
    var key=type+'-'+row.id;
    return '<div class="calc-row" id="calc-'+key+'">'
      +'<label class="calc-product" for="product-'+key+'"><span class="field-label">'+(type==='mahsulot'?'Mahsulot':'Xizmat')+'</span>'
      +'<select id="product-'+key+'" onchange="onSel(\''+type+'\','+row.id+',this.value)">'+opts+'</select></label>'
      +'<button type="button" aria-label="Qatorni o‘chirish" class="del-btn" onclick="removeCalcRow(\''+type+'\','+row.id+')">'+icon('trash',18)+'</button>'
      +'<div class="calc-fields">'
      +'<label for="price-'+key+'"><span class="field-label">Narx · so‘m / '+esc(prod.unit)+'</span>'
      +'<input id="price-'+key+'" class="price-input" type="text" inputmode="decimal" autocomplete="off" value="'+formatCalcPrice(price)+'"'
        +' oninput="onPrice(\''+type+'\','+row.id+',this.value,this)"'
        +' onblur="finishCalcInput(\''+type+'\','+row.id+',\'price\',this)"/></label>'
      +'<label for="quantity-'+key+'"><span class="field-label">Miqdor · '+esc(prod.unit)+'</span>'
      +'<input id="quantity-'+key+'" class="mq-input" type="text" inputmode="decimal" autocomplete="off" value="'+row.miqdor+'"'
        +' oninput="onMq(\''+type+'\','+row.id+',this.value,this)"'
        +' onblur="finishCalcInput(\''+type+'\','+row.id+',\'quantity\',this)"/></label></div>'
      +'<div class="calc-total"><span>Summa</span><output class="row-sum" for="price-'+key+' quantity-'+key+'">'+fmtN(sum)+'</output></div>'
    +'</div>';
  }).join('');
}
function renderAllRows(){
  renderCostRoomPicker();
  renderSection('mahsulot');renderSection('tikish');renderSection('ustanovka');
  renderQuickAdd('mahsulot');renderQuickAdd('tikish');renderQuickAdd('ustanovka');
  recalc();
}
function onSel(type,id,val){
  var row=calcRows[type].find(function(r){return r.id===id;});
  if(row){row.prodId=parseInt(val);var selectedProduct=products.find(function(p){return p.id===row.prodId;});row.price=selectedProduct?selectedProduct.price:0;saveCalc();renderSection(type);recalc();}
}
// Update amounts without replacing focused inputs or swallowing the next tap.
function calcNumber(val){
  var text=String(val).replace(/\s/g,'').replace(',','.');
  if(text==='')return 0;
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)&&Number.isFinite(Number(text))?Number(text):null;
}
function updateCalcAmounts(){
  ['mahsulot','tikish','ustanovka'].forEach(function(type){
    calcRows[type].forEach(function(row){
      var prod=products.find(function(p){return p.id===row.prodId;});
      var card=document.getElementById('calc-'+type+'-'+row.id);
      if(!card)return;
      card.querySelector('.row-sum').textContent=fmtN(row.miqdor*costRowPrice(row));
      var price=card.querySelector('.price-input');
      if(price!==document.activeElement)price.value=formatCalcPrice(costRowPrice(row));
    });
  });
  recalc();
}
function onMq(type,id,val,input){
  var row=calcRows[type].find(function(r){return r.id===id;});
  var value=calcNumber(val);
  if(input)input.setAttribute('aria-invalid',String(value===null));
  if(!row||value===null)return;
  row.miqdor=value;
  if(row.linkParda)row.autoSync=false;
  saveCalc();updateCalcAmounts();
}
function formatCalcPrice(value){
 var parts=String(value).replace(/\s/g,'').split(/([.,])/);
 parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');
 return parts.join('');
}
function formatPriceInput(input,raw){
 var caret=input.selectionStart==null?String(raw).length:input.selectionStart;
 var count=String(raw).slice(0,caret).replace(/\s/g,'').length;
 var formatted=formatCalcPrice(raw),pos=0,seen=0;
 while(pos<formatted.length&&seen<count){if(!/\s/.test(formatted[pos]))seen++;pos++;}
 input.value=formatted;
 if(input.setSelectionRange)input.setSelectionRange(pos,pos);
}
function onPrice(type,id,val,input){
  var row=calcRows[type].find(function(r){return r.id===id;});
  var value=calcNumber(val);
  if(input)input.setAttribute('aria-invalid',String(value===null));
  if(!row||value===null)return;
  var prod=products.find(function(p){return p.id===row.prodId;});
  if(!prod)return;
  row.price=value;
  if(input)formatPriceInput(input,val);
  saveCalc();updateCalcAmounts();
}
function finishCalcInput(type,id,field,input){
  var row=calcRows[type].find(function(r){return r.id===id;});
  if(!row)return;
  var prod=products.find(function(p){return p.id===row.prodId;});
  if(input.getAttribute('aria-invalid')==='true')showSnack('Musbat son kiriting. Masalan: 2,5');
  input.value=field==='price'?formatCalcPrice(costRowPrice(row)):row.miqdor;
  input.removeAttribute('aria-invalid');
}

function getSum(type){
  return calcRows[type].reduce(function(s,r){
    var p=products.find(function(x){return x.id===r.prodId;});
    return s+r.miqdor*costRowPrice(r);
  },0);
}

function recalc(){
  updateCostRoomTotal();
  var mS=getSum('mahsulot'),tS=getSum('tikish'),uS=getSum('ustanovka');
  var xizmat=tS+uS,grand=mS+xizmat;
  var ids=['mahsulot-subtotal','tikish-subtotal','ustanovka-subtotal',
           't-mahsulot','t-tikish','t-ustanovka','t-xizmat','t-grand'];
  var vals=[costRoomSum('mahsulot'),costRoomSum('tikish'),costRoomSum('ustanovka'),mS,tS,uS,xizmat,grand];
  ids.forEach(function(id,i){
    var el=document.getElementById(id);
    if(el)el.textContent=fmt(vals[i]);
  });
}

// ---- HISOB DETAIL (Hisob sahifasidagi batafsil ro'yxat) ----
function renderDetailSummary(){
  renderRoomCostSummary();
  var types=['mahsulot','tikish','ustanovka'];
  var colors={mahsulot:'var(--teal)',tikish:'var(--amber)',ustanovka:'var(--purple)'};
  types.forEach(function(type){
    var card=document.getElementById('summary-'+type+'-detail');
    var det=document.getElementById('detail-'+type);
    if(rooms.length){card.style.display='none';return;}
    if(!card||!det)return;
    var rows=calcRows[type];
    if(!rows.length){card.style.display='none';return;}
    card.style.display='block';
    det.innerHTML=rows.map(function(row){
      var prod=products.find(function(p){return p.id===row.prodId;});
      var name=prod?prod.name:'?';
      var price=costRowPrice(row);
      var sum=row.miqdor*price;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:14px;">'
        +'<span style="flex:1;color:var(--text);">'+esc(name)+'</span>'
        +'<span style="color:var(--muted);width:64px;text-align:center;">'+fmtN(price)+'</span>'
        +'<span style="color:var(--muted);width:40px;text-align:center;">×'+row.miqdor+'</span>'
        +'<span style="font-weight:800;width:78px;text-align:right;">'+fmtN(sum)+'</span>'
        +'</div>';
    }).join('')
    +'<div style="display:flex;justify-content:space-between;padding:7px 0 0;font-size:14px;font-weight:800;">'
      +'<span>Jami:</span><span style="color:'+colors[type]+'">'+fmt(getSum(type))+'</span>'
    +'</div>';
  });
}

// ---- SAQLASH SAHIFASI OLDINDAN KO'RISH ----
function renderSaqlash(){
  if(!document.getElementById('preview-client')){renderDetailSummary();return;}
  var saveBtn=document.getElementById('btn-save-jpg');
  if(saveBtn) saveBtn.innerHTML = orderEditId ? "✅ O'zgartirishni saqlash" : "📸 JPG rasmini saqlash";
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
