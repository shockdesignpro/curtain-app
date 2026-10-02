// ============================================================
// TARIX.JS — buyurtmalar tarixi, qidiruv, filtr, saralash, to'lov holati.
// 6-QADAM: qidiruv maydoniga debounce qo'llanadi — foydalanuvchi
// yozib bo'lguncha (250ms) ro'yxat qayta chizilmaydi, bu katta
// tarixda tez-tez qayta render bo'lishning oldini oladi.
// ============================================================

function setTarixDateFilter(f){
  tarixDateFilter=f;
  syncMobileFilterChips();
  document.querySelectorAll('#tarix-date-chips .chip').forEach(function(c){
    c.classList.toggle('active', c.dataset.tf===f);
  });
  renderTarix();
}
function tarixDateFrom(f){
  var now=new Date();
  if(f==='today'){
    return new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  }
  if(f==='week'){
    var day=now.getDay();
    var diff=(day===0?-6:1-day);
    return new Date(now.getFullYear(),now.getMonth(),now.getDate()+diff).getTime();
  }
  if(f==='month'){
    return new Date(now.getFullYear(),now.getMonth(),1).getTime();
  }
  return null;
}
function setTarixSort(mode){
  tarixSortMode=mode;
  syncMobileFilterChips();
  document.querySelectorAll('#tarix-sort-chips .chip').forEach(function(c){
    c.classList.toggle('active', c.dataset.sort===mode);
  });
  renderTarix();
}
// 4-band: to'lov holati bo'yicha filtr (hammasi/to'lanmagan/qisman/to'liq)
function setTarixPayFilter(f){
  tarixPayFilter=f;
  syncMobileFilterChips();
  document.querySelectorAll('#tarix-pay-chips .chip').forEach(function(c){
    c.classList.toggle('active', c.dataset.pf===f);
  });
  renderTarix();
}

// ---- BUGUN/ERTAGA TAYYOR BO'LADIGAN BUYURTMALAR (15-band) ----
function renderReadySoon(){
  var card=document.getElementById('ready-soon-card');
  var list=document.getElementById('ready-soon-list');
  if(!card||!list)return;
  var now=new Date();
  var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var dayAfter=new Date(today.getTime()+2*86400000);
  var items=orders.filter(function(o){
    if(!o.tayyorSana)return false;
    if(orderStepsDone(o)>=ORDER_STEPS.length)return false; // to'liq tayyor bo'lganlar bezovta qilmasin
    var d=new Date(o.tayyorSana);
    var dOnly=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    return dOnly.getTime()>=today.getTime() && dOnly.getTime()<dayAfter.getTime();
  }).sort(function(a,b){return new Date(a.tayyorSana)-new Date(b.tayyorSana);});
  if(!items.length){card.style.display='none';return;}
  card.style.display='block';
  list.innerHTML=items.map(function(o){
    var d=new Date(o.tayyorSana);
    var dOnly=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    var isToday=dOnly.getTime()===today.getTime();
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;" '
      +'onclick="tarixOpenId=\''+o.id+'\';renderTarix();document.getElementById(\'tarix-search\').scrollIntoView({behavior:\'smooth\'});">'
      +'<span>'+(isToday?'🔴 Bugun':'🟠 Ertaga')+' — '+esc(o.ism)+'</span>'
      +'<span style="color:var(--muted);">'+esc(o.tel)+'</span>'
    +'</div>';
  }).join('');
}

// ---- TO'LOV HOLATI ----
function orderPaidSum(o){
  return (o.payments||[]).reduce(function(s,p){return s+p.amount;},0);
}
function orderStatus(o){
  var paid=orderPaidSum(o);
  if(o.grand>0&&paid>=o.grand)return 'full';
  if(paid>0)return 'partial';
  return 'none';
}

// ---- ZAKAZ STATUSI (ishlab chiqarish bosqichlari) ----
function orderStepsDone(o){
  var st=o.status||{};
  return ORDER_STEPS.filter(function(s){return !!st[s.key];}).length;
}
function toggleOrderStep(orderId,stepKey){
  var o=orders.find(function(x){return x.id===orderId;});
  if(!o)return;
  if(!o.status)o.status={};
  o.status[stepKey]=!o.status[stepKey];
  saveOrders();
  renderTarix();
  var panel=document.getElementById('order-record-'+orderId);if(panel){var status=panel.querySelector('.order-status-panel');if(status)status.open=true;}
}
function setTikuvchiIsm(orderId,val){
  var o=orders.find(function(x){return x.id===orderId;});
  if(!o)return;
  o.tikuvchiIsmi=val;
  saveOrders();
}
function progressStage(pct){
  if(pct>=90) return 'stage-green';
  if(pct>=50) return 'stage-amber';
  return 'stage-red';
}
function buildStepsHtml(o){
  var st=o.status||{};
  var rows=ORDER_STEPS.map(function(s){
    var checked=!!st[s.key];
    var nameField='';
    if(s.hasName && checked){
      nameField='<input type="text" placeholder="Tikuvchi ismi" value="'+esc(o.tikuvchiIsmi||'')+'" '
        +'onclick="event.stopPropagation();" onchange="setTikuvchiIsm(\''+o.id+'\',this.value)" '
        +'style="margin-left:28px;margin-top:4px;padding:6px 9px;font-size:13px;border:1.5px solid var(--border);border-radius:7px;font-family:var(--font);box-sizing:border-box;width:calc(100% - 28px);"/>';
    }
    return '<div style="padding:3px 0;">'
      +'<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="event.stopPropagation();toggleOrderStep(\''+o.id+'\',\''+s.key+'\')">'
        +'<span style="width:18px;height:18px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;'
          +(checked?'background:var(--teal-mid);color:#fff;':'background:var(--card);border:1.5px solid var(--border);')+'">'+(checked?'✓':'')+'</span>'
        +'<span style="font-size:13px;'+(checked?'color:var(--text);font-weight:700;':'color:var(--muted);')+'">'+esc(s.label)+'</span>'
      +'</div>'
      +nameField
    +'</div>';
  }).join('');
  var done=orderStepsDone(o);
  var pct=Math.round(done/ORDER_STEPS.length*100);
  var stage=progressStage(pct);
  var progressHtml='<div class="progress-wrap"><div class="progress-fill '+stage+(pct>=100?' full':'')+'" style="width:'+pct+'%;"></div></div>'
    +'<div class="progress-pct">'+pct+'%</div>';
  return '<div class="order-status-content">'
    +progressHtml
    +'<div style="margin-top:6px;">'+rows+'</div>'
  +'</div>';
}
function addPayment(id){
  var input=document.getElementById('pay-input-'+id);
  if(!input)return;
  var amount=parsePrice(input.value);
  if(!amount||amount<=0){showSnack("⚠️ To'lov summasini kiriting");return;}
  var o=orders.find(function(x){return x.id===id;});
  if(!o)return;
  var remaining=Math.max(0,(o.grand||0)-orderPaidSum(o));
  if(!Number.isFinite(amount)||amount>remaining){input.setAttribute('aria-invalid','true');input.focus();showSnack('Qolgan qarz '+fmt(remaining)+'. Shu summadan oshmagan to‘lov kiriting.');return;}
  input.removeAttribute('aria-invalid');
  if(!o.payments)o.payments=[];
  var now=new Date();
  var dateStr=now.getDate()+'/'+(now.getMonth()+1)+'/'+now.getFullYear()+' '+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
  o.payments.push({amount:amount, date:now.getTime(), dateStr:dateStr});
  saveOrders();
  renderTarix();
  showSnack("✅ To'lov qo'shildi");
}
function removePayment(id,idx){
  var o=orders.find(function(x){return x.id===id;});
  if(!o||!o.payments)return;
  o.payments.splice(idx,1);
  saveOrders();
  renderTarix();
}

function renderTarix(){
  var focused=typeof focusedMobileOrderId!=='undefined'?focusedMobileOrderId:null;
  var page=document.getElementById('page-tarix');page.classList.toggle('focused-order',focused!==null);
  var banner=document.getElementById('focused-order-nav');if(banner)banner.hidden=focused===null;
  var count=document.getElementById('filter-active-count');if(count){var n=(tarixPayFilter!=='all'?1:0)+(tarixDateFilter!=='all'?1:0)+(tarixSortMode!=='yangi'?1:0);count.textContent=n?'('+n+')':'';}
  renderReadySoon();
  var qRaw=(document.getElementById('tarix-search').value||'').trim();
  var qDigits=normPhone(qRaw);
  var qLower=qRaw.toLowerCase();
  var list=document.getElementById('tarix-list');
  var empty=document.getElementById('tarix-empty');
  var emptyText=document.getElementById('tarix-empty-text');
  var clearBtn=document.getElementById('tarix-clear-btn');
  clearBtn.style.display=orders.length?'block':'none';

  var dateFrom=tarixDateFrom(tarixDateFilter);

  var filtered=orders.filter(function(o){
    var telMatch=!qRaw||(qDigits&&normPhone(o.tel).indexOf(qDigits)!==-1);
    var nameMatch=!qRaw||(o.ism||'').toLowerCase().indexOf(qLower)!==-1;
    var searchOk=!qRaw||telMatch||nameMatch;
    var dateOk=dateFrom===null||(o.date&&o.date>=dateFrom);
    var payOk=tarixPayFilter==='all'||(tarixPayFilter==='unpaid'?orderStatus(o)!=='full':orderStatus(o)===tarixPayFilter);
    return (focused===null||String(o.id)===String(focused))&&searchOk&&dateOk&&payOk;
  });

  if(tarixSortMode==='muddat'){
    filtered=filtered.slice().sort(function(a,b){
      var ad=a.tayyorSana?new Date(a.tayyorSana).getTime():Infinity;
      var bd=b.tayyorSana?new Date(b.tayyorSana).getTime():Infinity;
      return ad-bd;
    });
  }

  if(!filtered.length){
    list.innerHTML='';
    empty.style.display='block';
    emptyText.textContent=orders.length?"Bu raqam yoki ism bo'yicha buyurtma topilmadi.":"Hali buyurtmalar tarixi yo'q.\nJPG saqlangan har bir hisob shu yerda ko'rinadi.";
    return;
  }
  empty.style.display='none';

  list.innerHTML=filtered.map(function(o){
    var isOpen=tarixOpenId===o.id;
    var detailHtml=orderRoomDetails(o);
    if(o.andoza&&o.andoza.length){
      detailHtml+='<div style="font-size:13px;font-weight:800;color:var(--purple);margin:8px 0 4px;">🖼️ Andozalar</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:8px;">'
        +o.andoza.map(function(a){
          var src=(typeof a==='string')?a:a.src;
          var caption=(typeof a==='string')?'':(a.caption||'');
          return '<div style="width:56px;">'
            +'<img src="'+src+'" onclick="event.stopPropagation();openImageViewer(\''+src+'\')" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;"/>'
            +(caption?'<div style="font-size:13px;color:var(--muted);text-align:center;margin-top:2px;word-break:break-word;">'+esc(caption)+'</div>':'')
          +'</div>';
        }).join('')
        +'</div>';
    }
    var tayyorLine=o.tayyorSana?'<div style="font-size:13px;color:var(--teal);margin-top:1px;font-weight:700;">🚚 Tayyor: '+esc(o.tayyorSana)+'</div>':'';

    // To'lov holati
    var paidSum=orderPaidSum(o);
    var remain=Math.max(0,(o.grand||0)-paidSum);
    var status=orderStatus(o);
    var statusInfo={
      full:{label:"✅ To'liq to'landi",color:'var(--teal)',bg:'var(--teal-light)'},
      partial:{label:"🟡 Bo'nak olindi",color:'#a06800',bg:'var(--amber-light)'},
      none:{label:"🔴 To'lanmagan",color:'var(--red)',bg:'var(--red-light)'}
    }[status];
    var payBadge='<span style="font-size:13px;font-weight:800;padding:3px 8px;border-radius:20px;color:'+statusInfo.color+';background:'+statusInfo.bg+';white-space:nowrap;">'+statusInfo.label+'</span>';

    var payHistory=(o.payments||[]).map(function(p,idx){
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:13px;">'
        +'<span style="color:var(--muted);">'+esc(p.dateStr)+'</span>'
        +'<span style="font-weight:700;color:var(--text);">'+fmt(p.amount)+'</span>'
        +'<button onclick="event.stopPropagation();removePayment(\''+o.id+'\','+idx+')" style="background:none;border:none;color:var(--red);font-size:13px;cursor:pointer;padding:2px 6px;">✕</button>'
      +'</div>';
    }).join('');
    var paySection='<div style="margin-top:8px;padding:10px;border-radius:10px;background:'+statusInfo.bg+';">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
        +'<span style="font-size:13px;font-weight:800;color:'+statusInfo.color+';">'+statusInfo.label+'</span>'
        +'<span style="font-size:13px;color:var(--muted);white-space:nowrap;">'+fmt(paidSum)+' / '+fmt(o.grand)+'</span>'
      +'</div>'
      +(remain>0?'<div style="font-size:13px;color:var(--muted);margin-top:2px;">Qoldiq: '+fmt(remain)+'</div>':'')
      +(payHistory?'<div style="margin-top:6px;border-top:1px solid rgba(0,0,0,.08);padding-top:4px;">'+payHistory+'</div>':'')
      +(remain>0?
        '<div style="display:flex;gap:6px;margin-top:8px;">'
          +'<input type="text" inputmode="decimal" id="pay-input-'+o.id+'" placeholder="Summa" onclick="event.stopPropagation();" style="flex:1;min-width:0;padding:7px 9px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);box-sizing:border-box;"/>'
          +'<button onclick="event.stopPropagation();addPayment(\''+o.id+'\')" style="background:var(--teal);color:#fff;border:none;border-radius:8px;padding:0 14px;font-size:13px;font-weight:800;cursor:pointer;">➕ Qo\'shish</button>'
        +'</div>'
      :'')
    +'</div>';

    var stepsDone=orderStepsDone(o);
    var stepsPct=Math.round(stepsDone/ORDER_STEPS.length*100);
    var stepsColors={
      'stage-red':{color:'var(--red)',bg:'var(--red-light)'},
      'stage-amber':{color:'#a06800',bg:'var(--amber-light)'},
      'stage-green':{color:'var(--teal)',bg:'var(--teal-light)'}
    }[progressStage(stepsPct)];
    var stepsBadge='<span style="font-size:13px;font-weight:800;padding:3px 8px;border-radius:20px;color:'+stepsColors.color+';background:'+stepsColors.bg+';white-space:nowrap;">🧾 '+stepsDone+'/'+ORDER_STEPS.length+' ('+stepsPct+'%)</span>';

    return '<div class="card order-record" id="order-record-'+esc(o.id)+'">'
      +'<div class="order-actions">'
        +'<button type="button" class="btn-icon" aria-label="Buyurtmani tahrirlash" onclick="loadOrderForEdit('+esc(JSON.stringify(o.id))+')">'+icon('edit',17)+'</button>'
        +'<button type="button" class="btn-icon" aria-label="Chekni ulashish" onclick="redownloadOrderJPG('+esc(JSON.stringify(o.id))+')">'+icon('share',17)+'</button>'
        +'<button type="button" class="btn-icon delete-order" aria-label="Buyurtmani o‘chirish" onclick="deleteTarixItem('+esc(JSON.stringify(o.id))+')">'+icon('trash',17)+'</button>'
      +'</div>'
      +orderCardHeader(o,isOpen)
      +'<div style="display:'+(isOpen?'block':'none')+';margin-top:2px;">'
        +detailHtml
        +paySection
        +'<details class="order-status-panel"><summary><span>Buyurtma holati</span><strong>'+orderStepsDone(o)+'/'+ORDER_STEPS.length+'</strong></summary>'+buildStepsHtml(o)+'</details>'
      +'</div>'
    +'</div>';
  }).join('');
}
// 6-qadam: debounce qilingan qidiruv — HTML'dagi oninput shu funksiyani chaqiradi
var renderTarixDebounced = debounce(renderTarix, 250);

function toggleTarixDetail(id){
  tarixOpenId=(tarixOpenId===id)?null:id;
  renderTarix();
}
// ---- BUYURTMANI TAHRIRLASH ("O'zgartirish") ----
// Tarixdagi eski buyurtmani joriy formalarga (mijoz/xona/andoza/hisob) qaytarib
// yuklaydi. Foydalanuvchi o'zgartirib, "Saqlash" bosganda YANGI buyurtma
// qo'shilmaydi - shu buyurtmaning o'zi yangilanadi (chek.js dagi orderEditId tekshiruvi).
function loadOrderForEdit(id){
  var o=orders.find(function(x){return x.id===id;});
  if(!o)return;

  // Mijoz
  document.getElementById('mijoz-ism').value=o.ism||'';
  document.getElementById('mijoz-manzil').value=o.manzil||'';
  document.getElementById('mijoz-tel').value=o.tel||'+998';
  document.getElementById('mijoz-tayyor-sana').value=o.tayyorSana||'';
  saveClient();

  // Xonalar - yangi ID'lar bilan (eski ID'lar bilan to'qnashmasligi uchun)
  var roomMap={},pardaMap={};
  rooms=(o.rooms||[]).map(function(r){
    var newId=++roomCnt;if(r.id!=null)roomMap[String(r.id)]=newId;
    return {
      id:newId,
      nomi:r.nomi,
      pardalar:(r.pardalar||[]).map(function(p){
        var newPardaId=++pardaCnt;if(p.id!=null)pardaMap[String(p.id)]=newPardaId;
        return {id:newPardaId, tur:p.tur||'deraza', boyi:p.boyi||'', eni:p.eni||'', karniz:p.karniz||'Truba', rang:p.rang||'Oq'};
      })
    };
  });
  saveRooms();

  // Andozalar
  andozaImages=(o.andoza||[]).map(function(a){
    return (typeof a==='string')?{src:a,caption:''}:{src:a.src,caption:a.caption||''};
  });
  saveAndoza();

  // Hisob qatorlari - avval prodId bo'yicha, topilmasa nom+bo'lim bo'yicha bog'laymiz
  var missing=[];
  calcRows={mahsulot:[],tikish:[],ustanovka:[]};
  ['mahsulot','tikish','ustanovka'].forEach(function(type){
    ((o.rows&&o.rows[type])||[]).forEach(function(row){
      var prod=null;
      if(row.prodId) prod=products.find(function(p){return p.id===row.prodId;});
      if(!prod) prod=products.find(function(p){return p.bolim===type&&p.name===row.name;});
      if(prod){
        calcRows[type].push({id:++rowCnt,prodId:prod.id,miqdor:row.miqdor,price:row.price,roomId:roomMap[String(row.roomId)]||null,costPardaId:pardaMap[String(row.costPardaId)],linkParda:pardaMap[String(row.linkParda)],autoSync:row.autoSync});
      } else {
        missing.push(row.name);
      }
    });
  });
  saveCalc();

  orderEditId=id;
  tarixOpenId=null;

  renderRooms();renderAndoza();renderAllRows();renderDetailSummary();
  showEditBanner(o.ism);
  switchPage('mahsulotlar');

  if(missing.length){
    showSnack('⚠️ Topilmadi: '+missing.join(', ')+" — qo'lda qo'shing");
  } else {
    showSnack('✏️ Tahrirlash rejimi — o\'zgartirib, "Saqlash"ni bosing');
  }
}
function cancelEditOrder(){
  showConfirm("Tahrirlashni bekor qilamiz? Joriy kiritilgan o'zgarishlar saqlanmaydi.", {danger:true, okText:'Bekor qilish'}).then(function(ok){
    if(!ok)return;
    orderEditId=null;
    hideEditBanner();
    resetAllData();
    showSnack('Tahrirlash bekor qilindi');
  });
}
function showEditBanner(ism){
  var b=document.getElementById('edit-banner');
  var n=document.getElementById('edit-banner-name');
  if(n) n.textContent=ism||'';
  if(b) b.style.display='flex';
}
function hideEditBanner(){
  var b=document.getElementById('edit-banner');
  if(b) b.style.display='none';
}

// 7-band: darhol o'chiradi, lekin bir necha soniya "BEKOR QILISH" bilan tiklash imkonini beradi
function deleteTarixItem(id){
  var idx=orders.findIndex(function(o){return o.id===id;});
  if(idx===-1)return;
  var removed=orders[idx];
  if(focusedMobileOrderId===id)focusedMobileOrderId=null;
  orders=orders.filter(function(o){return o.id!==id;});
  saveOrders();renderTarix();
  showUndoSnack("🗑️ \""+esc(removed.ism||'Buyurtma')+"\" o'chirildi", function(){
    orders.splice(Math.min(idx,orders.length),0,removed);
    saveOrders();renderTarix();
    showSnack('↩️ Tiklandi');
  });
}
function tozalaTarix(){
  showConfirm('Butun buyurtmalar tarixini tozalash? Bu amalni orqaga qaytarib bo\'lmaydi.', {danger:true, okText:'Tozalash'}).then(function(ok){
    if(!ok)return;
    orders=[];saveOrders();renderTarix();
    showSnack('🗑️ Tarix tozalandi');
  });
}
