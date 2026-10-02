// Phone-first presentation. Uses original state, prices, colors and receipt functions.
var mobilePage='home';
var focusedMobileOrderId=null;
var orderReturnState=null;
var reportPeriod='month';
var EDITOR_PAGES=['mahsulotlar','xizmatlar','hisob'];
function hasMobileDraft(){return !!(clientData.manzil||clientData.tayyorSana||clientData.ism||(clientData.tel||'').replace('+998','')||rooms.length||andozaImages.length||Object.keys(calcRows).some(function(k){return calcRows[k].length;}));}
function mobileStage(o){
  var st=o.status||{};
  if(st.parda_ornatish||orderStepsDone(o)>=ORDER_STEPS.length)return 'O‘rnatildi';
  if(st.dazmolandi)return 'Tayyor';
  if(st.tikuvchiga_berildi||st.bichildi||st.chetlari_tikildi||st.boy_chiqarildi||st.tepasi_tikildi)return 'Tikilmoqda';
  if(st.sotib_olindi)return 'Mato olindi';
  return 'Yangi buyurtma';
}
function mobileDate(date){if(!date)return 'Sana belgilanmagan';var parts=date.split('-');return parts.length===3?parts.reverse().join('.'):date;}
function mobileRemaining(o){return Math.max(0,(o.grand||0)-orderPaidSum(o));}
function mobileThumbnail(o){
  var a=(o.andoza||[])[0];var src=typeof a==='string'?a:a&&a.src;
  if(src && /^(data:image\/|https?:\/\/)/i.test(src))return '<img class="order-thumb" src="'+esc(src)+'" alt="Tanlangan parda andozasi" loading="lazy"/>';
  return '<span class="order-thumb" aria-hidden="true">'+esc((o.ism||'M').trim().slice(0,1).toUpperCase())+'</span>';
}
function mobileEmpty(title,description){return '<div class="home-empty">'+icon('inbox',29)+'<h3>'+esc(title)+'</h3><p>'+esc(description)+'</p></div>';}
function mobileCompactOrder(o,showDebt){
  var stage=mobileStage(o);var late=o.tayyorSana&&new Date(o.tayyorSana+'T23:59:59')<new Date()&&stage!=='O‘rnatildi';
  return '<button class="compact-order" onclick="openMobileOrder('+esc(JSON.stringify(o.id))+')">'+mobileThumbnail(o)
    +'<span class="compact-info"><span class="compact-heading"><span class="compact-name">'+esc(o.ism||'Mijoz')+'</span><span class="state-badge '+(late?'late':stage==='Tayyor'||stage==='O‘rnatildi'?'':'pending')+'">'+esc(stage)+'</span></span><span class="compact-date">'+(late?'Muddat o‘tgan · ':'Topshirish · ')+esc(mobileDate(o.tayyorSana))+'</span>'
    +'<span class="compact-foot"><strong>'+(showDebt?'Qoldiq: ':'')+fmt(showDebt?mobileRemaining(o):o.grand)+'</strong></span></span></button>';
}
function orderCardHeader(o,isOpen){
  return '<button class="order-record-head" aria-expanded="'+isOpen+'" onclick="openMobileOrder('+esc(JSON.stringify(o.id))+')">'+mobileThumbnail(o)
    +'<span class="order-head-info"><span class="order-head-name">'+esc(o.ism)+'</span><span class="order-head-phone">'+esc(o.tel)+'</span><span class="compact-date">Topshirish: '+esc(mobileDate(o.tayyorSana))+'</span>'
    +'<span class="order-head-foot"><span class="state-badge">'+esc(mobileStage(o))+'</span><span class="state-badge '+(orderStatus(o)==='full'?'':'pending')+'">'+(orderStatus(o)==='full'?'To‘langan':orderStatus(o)==='partial'?'Qisman to‘langan':'To‘lanmagan')+'</span></span></span></button>'
    +'<div class="order-money"><span>Qoldiq: '+fmt(mobileRemaining(o))+'</span><strong>'+fmt(o.grand)+'</strong></div>';
}
function renderMobileHome(){
  document.getElementById('resume-draft').hidden=!hasMobileDraft();
  var active=orders.filter(function(o){return mobileStage(o)!=='O‘rnatildi';});
  var tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(23,59,59,999);
  var due=active.filter(function(o){return o.tayyorSana&&new Date(o.tayyorSana+'T00:00:00')<=tomorrow;}).sort(function(a,b){return a.tayyorSana.localeCompare(b.tayyorSana);});
  document.getElementById('home-active').textContent=active.length;
  document.getElementById('home-due-count').textContent=due.length+' ta';
  document.getElementById('home-debt').textContent=fmt(orders.reduce(function(s,o){return s+mobileRemaining(o);},0));
  var today=new Date();
  var months=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  var weekdays=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  document.getElementById('home-date').textContent=today.getDate()+' '+months[today.getMonth()]+' · '+weekdays[today.getDay()];
  document.getElementById('home-due').innerHTML=due.length?due.slice(0,3).map(function(o){return mobileCompactOrder(o,false);}).join(''):mobileEmpty('Yaqin muddatli buyurtma yo‘q','Bugun va ertaga topshiriladigan buyurtmalar shu yerda ko‘rinadi.');
  var recent=orders.slice().sort(function(a,b){return b.date-a.date;}).slice(0,4);
  document.getElementById('home-recent').innerHTML=recent.length?recent.map(function(o){return mobileCompactOrder(o,false);}).join(''):mobileEmpty('Birinchi buyurtmangizni yarating','Mijozni kiriting, o‘lchamlarni belgilang va chekni saqlang.');
}
function renderMobileFinance(){
  var selected=reportOrders(orders,reportPeriod,new Date());
  var debt=0,paid=0,total=0;
  selected.forEach(function(o){debt+=mobileRemaining(o);total+=o.grand||0;if(orderStatus(o)==='full')paid+=o.grand||0;});
  document.getElementById('finance-debt').textContent=fmt(debt);document.getElementById('finance-paid').textContent=fmt(paid);document.getElementById('finance-orders').textContent=fmt(total);
  document.getElementById('finance-list').innerHTML=selected.length?selected.map(function(o){return mobileCompactOrder(o,true);}).join(''):mobileEmpty('Buyurtmalar yo‘q','Tanlangan davrda buyurtma topilmadi.');
}
function reportOrders(items,period,now){
  var start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(start);
  if(period==='all')return items.slice();
  if(period==='week')start.setDate(start.getDate()-((start.getDay()+6)%7));
  if(period==='month')start.setDate(1);
  if(period==='year')start=new Date(now.getFullYear(),0,1);
  end=new Date(start);
  if(period==='year')end.setFullYear(end.getFullYear()+1);else if(period==='month')end.setMonth(end.getMonth()+1);else end.setDate(end.getDate()+(period==='week'?7:1));
  return items.filter(function(o){return o.date>=start.getTime()&&o.date<end.getTime();});
}
function pickGallerySamples(){if(window.NativeBridge&&NativeBridge.isNative)return NativeBridge.pickGallerySamples();document.getElementById('andoza-file').click();}
function refreshMobile(){
  document.getElementById('dock-total').textContent=fmt(getSum('mahsulot')+getSum('tikish')+getSum('ustanovka'));
  if(mobilePage==='home')renderMobileHome();
  if(mobilePage==='finance')renderMobileFinance();
}
function switchPage(name){
  if(name==='saqlash')name='hisob';
  var target=EDITOR_PAGES.indexOf(name);
  if(target>0){
    if(!validateCustomerStep()){name='mahsulotlar';}
    else if(target>1&&!validateServicesStep()){name='xizmatlar';}
  }

  if(!document.getElementById('page-'+name))return;
  if(name==='xizmatlar'&&mobilePage!=='xizmatlar'){activeCostRoom=rooms.length?rooms[0].id:null;activeCostParda=undefined;}
  document.getElementById('catalog-tools').hidden=name!=='catalog';
  mobilePage=name;
  if(name==='tarix')focusedMobileOrderId=null;
  if(EDITOR_PAGES.indexOf(name)!==-1){safeSetLS('parda_draft_meta',{step:name,orderId:orderEditId||null});}
  document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('active',p.id==='page-'+name);});
  var editor=EDITOR_PAGES.indexOf(name)!==-1;
  document.querySelectorAll('.nav-btn').forEach(function(b){var active=b.id==='nav-'+name;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.querySelector('.bottom-nav').hidden=editor;
  document.getElementById('editor-dock').hidden=!editor;
  document.getElementById('editor-progress').hidden=!editor;
  document.getElementById('mobile-back').hidden=name==='home';
  var titles={home:'Lobar',settings:'Sozlamalar',tarix:'Buyurtmalar',catalog:'Katalog',finance:'Hisobot',mahsulotlar:orderEditId?'Buyurtma tahriri':'Yangi buyurtma',xizmatlar:'Mahsulot va xizmatlar',hisob:'Hisobni tekshirish',saqlash:'Chekni saqlash'};
  document.getElementById('header-title').textContent=titles[name];
  document.getElementById('header-caption').textContent=editor?'BUYURTMA · '+(EDITOR_PAGES.indexOf(name)+1)+' / 3':'PARDALAR UYI';
  document.querySelectorAll('[data-editor]').forEach(function(b){var active=b.dataset.editor===name;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  document.getElementById('editor-next').innerHTML=(name==='saqlash'?'JPG saqlash':name==='hisob'?'Chek tayyorlash':'Davom etish')+' <span aria-hidden="true">→</span>';
  renderAllRows();
  if(name==='hisob')renderDetailSummary();

  if(name==='tarix')renderTarix();
  if(name==='catalog'){setFilter(filterVal);renderProdList();}
  if(name==='settings'&&window.renderReminderSettings)renderReminderSettings();
  refreshMobile();window.scrollTo({top:0,behavior:'instant'});
}
function nextMobileStep(){
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  var i=EDITOR_PAGES.indexOf(mobilePage);
  if(i===0){if(validateCustomerStep())switchPage('xizmatlar');}
  else if(i===1){if(validateServicesStep())switchPage('hisob');}
  else if(i===2){if(!validateCustomerStep()){switchPage('mahsulotlar');return;}if(!validateServicesStep()){switchPage('xizmatlar');return;}exportJPG();}
}
function stepError(id,text){var el=document.getElementById(id);showSnack(text);if(el){el.setAttribute('aria-invalid','true');el.focus();el.scrollIntoView({block:'center',behavior:'smooth'});}return false;}
function validateCustomerStep(){
  ['mijoz-ism','mijoz-manzil','mijoz-tel'].forEach(function(id){document.getElementById(id).removeAttribute('aria-invalid');});
  if(!document.getElementById('mijoz-ism').value.trim())return stepError('mijoz-ism','Mijoz ismini kiriting');
  if(!document.getElementById('mijoz-manzil').value.trim())return stepError('mijoz-manzil','Mijoz manzilini kiriting');
  if(!/^998[0-9]{9}$/.test(normPhone(document.getElementById('mijoz-tel').value)))return stepError('mijoz-tel','Telefon raqamini to‘liq kiriting: +998 va 9 ta raqam');
  for(var r of rooms){for(var p of (r.pardalar||[])){for(var key of ['boyi','eni']){
    if(!(parseMq(p[key])>0))return stepError('parda-'+r.id+'-'+p.id+'-'+key,'Qo‘shilgan xonadagi bo‘yi va enini to‘liq kiriting');
  }}}
  saveClient();return true;
}
function validateServicesStep(){
  var rows=[].concat(calcRows.mahsulot,calcRows.tikish,calcRows.ustanovka);
  if(!rows.length||getSum('mahsulot')+getSum('tikish')+getSum('ustanovka')<=0){showSnack('Kamida bitta mahsulot yoki xizmat va uning miqdorini kiriting');return false;}
  for(var row of rows){var prod=products.find(function(p){return p.id===row.prodId;});if(!prod||!Number.isFinite(Number(row.miqdor))||Number(row.miqdor)<=0||!Number.isFinite(costRowPrice(row))||costRowPrice(row)<0){showSnack('Har bir qatorda mahsulot, to‘g‘ri narx va musbat miqdor bo‘lishi kerak');return false;}}
  return true;
}
function resumeMobileOrder(){
  var meta={};try{meta=JSON.parse(localStorage.getItem('parda_draft_meta')||'{}');}catch(e){}
  switchPage(EDITOR_PAGES.indexOf(meta.step)>=0?meta.step:'mahsulotlar');
}
function beginMobileOrder(){newClient();}
function openMobileOrder(id){
  var order=orders.find(function(o){return String(o.id)===String(id);});
  if(!order){showSnack('Buyurtma topilmadi');return;}
  if(focusedMobileOrderId===null)orderReturnState={page:mobilePage,y:window.scrollY||0,search:document.getElementById('tarix-search').value,pay:tarixPayFilter,date:tarixDateFilter,sort:tarixSortMode};
  switchPage('tarix');focusedMobileOrderId=order.id;tarixOpenId=order.id;renderTarix();syncMobileFilterChips();
  requestAnimationFrame(function(){window.scrollTo({top:0,behavior:'instant'});});
}
function returnFromOrder(){
  var state=orderReturnState;orderReturnState=null;focusedMobileOrderId=null;tarixOpenId=null;
  if(!state){showAllOrders();return;}
  document.getElementById('tarix-search').value=state.search;tarixPayFilter=state.pay;tarixDateFilter=state.date;tarixSortMode=state.sort;
  switchPage(state.page);syncMobileFilterChips();requestAnimationFrame(function(){window.scrollTo({top:state.y,behavior:'instant'});});
}
function showAllOrders(sort){orderReturnState=null;document.getElementById('tarix-search').value='';tarixDateFilter='all';tarixPayFilter='all';tarixSortMode=sort||'yangi';switchPage('tarix');syncMobileFilterChips();}
function showUnpaidOrders(){showAllOrders();tarixPayFilter='unpaid';renderTarix();syncMobileFilterChips();}
function syncMobileFilterChips(){document.getElementById('tarix-pay-filter').value=tarixPayFilter;document.getElementById('tarix-date-filter').value=tarixDateFilter;document.getElementById('tarix-sort-filter').value=tarixSortMode;document.querySelectorAll('[data-pf]').forEach(function(el){el.classList.toggle('active',el.dataset.pf===tarixPayFilter);});document.querySelectorAll('[data-tf]').forEach(function(el){el.classList.toggle('active',el.dataset.tf===tarixDateFilter);});document.querySelectorAll('[data-sort]').forEach(function(el){el.classList.toggle('active',el.dataset.sort===tarixSortMode);});}
function showBackups(){switchPage('tarix');document.getElementById('backup-panel').scrollIntoView({behavior:'smooth',block:'start'});}
function captureMobilePhoto(){if(window.NativeBridge&&NativeBridge.isNative)NativeBridge.capturePhoto();else{var input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('capture','environment');input.onchange=function(){onAndozaFiles(input.files);};input.click();}}
function requestMobileReminders(){if(window.NativeBridge&&NativeBridge.isNative)NativeBridge.enableReminders();else showSnack('Tayyor sanani tanlang: chek bilan taqvim eslatmasi ham yuklanadi.');}
function mobileBack(){
  var intro=document.getElementById('brand-intro');if(intro&&!intro.hidden){if(window.finishBrandIntro)finishBrandIntro();return true;}
  if(document.getElementById('lock-ov')&&!document.getElementById('lock-ov').classList.contains('hidden'))return false;
  var closers=[['confirm-ov',function(){document.getElementById('confirm-cancel-btn').click();}],['img-viewer-ov',closeImageViewer],['add-modal',closeModal],['quick-actions',closeQuickActions]];
  for(var i=0;i<closers.length;i++){if(document.getElementById(closers[i][0]).classList.contains('open')){closers[i][1]();return true;}}
  if(mobilePage==='tarix'&&focusedMobileOrderId!==null){returnFromOrder();return true;}
  var idx=EDITOR_PAGES.indexOf(mobilePage);if(idx>0){switchPage(EDITOR_PAGES[idx-1]);return true;}
  if(mobilePage!=='home'){switchPage('home');return true;}return false;
}
(function(){
  document.getElementById('theme-toggle-btn').innerHTML=icon(getTheme()==='dark'?'sun':'moon',18);
  openDrawer=function(){switchPage('catalog');};closeDrawer=function(){switchPage('home');};
  var recalcBase=recalc;recalc=function(){recalcBase();refreshMobile();};
  var saveBase=safeSetLS;safeSetLS=function(key,value){var ok=saveBase(key,value);if(ok){refreshMobile();if(window.NativeBridge)NativeBridge.persist();}return ok;};
  var resetBase=resetAllData;resetAllData=function(){resetBase();localStorage.removeItem('parda_draft_meta');refreshMobile();if(window.NativeBridge)NativeBridge.persist();};
  // Preserve filtering, details, payments, production steps and all existing actions.
  document.addEventListener('keydown',function(e){if(e.key==='Escape')mobileBack();});
  try{var meta=JSON.parse(localStorage.getItem('parda_draft_meta')||'{}');if(meta.orderId&&orders.some(function(o){return o.id===meta.orderId;}))orderEditId=meta.orderId;}catch(e){}
  switchPage('home');
})();

function resetOrderFilters(){tarixPayFilter='all';tarixDateFilter='all';tarixSortMode='yangi';syncMobileFilterChips();renderTarix();}
function completeMobileReceipt(savedCurrentOrder){
  if(savedCurrentOrder)resetAllData();
  switchPage('home');
}
// Keep receipt rendering unchanged; return home only on successful export.
(function(){
  var downloadBase=downloadJpgFromReceipt;
  downloadJpgFromReceipt=function(rcpt,ism,date,onDone){
    return downloadBase(rcpt,ism,date,function(){if(onDone)onDone();completeMobileReceipt(!!onDone);});
  };
})();
