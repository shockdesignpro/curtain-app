// ============================================================
// CHEK.JS — hisob-faktura (chek) HTML qurish, JPG qilib yuklash,
// taqvim eslatmasi (.ics) generatsiya qilish.
// html2canvas endi CDN emas, js/vendor/html2canvas.min.js dan
// LOKAL yuklanadi (2-qadam) — internet bo'lmasa ham JPG eksport ishlaydi.
// ============================================================

// Chek (hisob-faktura) HTML sini quradi. Ham joriy hisobni saqlashda (exportJPG),
// ham Tarixdan eski buyurtmani qayta yuklab olishda (redownloadOrderJPG) ishlatiladi -
// ikkalasida ham bir xil ko'rinish chiqishi uchun.
function receiptDateTime(timestamp){
  var d=new Date(timestamp);return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function buildReceiptHtmlBase(data){
  function makeRows(rows){
    if(!rows.length)return '<div style="font-size:11px;color:#999;padding:4px 6px;">Qatorlar yo\'q</div>';
    return rows.map(function(row){
      return '<div class="rcpt-row">'
        +'<span class="rcpt-name">'+esc(row.name)+'</span>'
        +'<span class="rcpt-price">'+fmtN(row.price)+'</span>'
        +'<span class="rcpt-mq">×'+row.miqdor+'</span>'
        +'<span class="rcpt-sum">'+fmtN(row.sum)+'</span>'
        +'</div>';
    }).join('');
  }
  function makeRoomsHtml(){
    var withPardalar=(data.rooms||[]).filter(function(r){return (r.pardalar||[]).length;});
    if(!withPardalar.length)return '';
    var body=withPardalar.map(function(r,ridx){
      var pRows=r.pardalar.map(function(p,idx){
        var boyi=(p.boyi!==''&&p.boyi!=null)?p.boyi:'—';
        var eni=(p.eni!==''&&p.eni!=null)?p.eni:'—';
        return '<div class="rcpt-row" style="border-bottom:1px solid #eee;">'
          +'<span class="rcpt-name">'+pardaLabel(r.pardalar,idx)+' <span style="color:#999;">('+esc(p.karniz)+', '+esc(p.rang)+')</span></span>'
          +'<span class="rcpt-sum">'+esc(boyi)+' × '+esc(eni)+' m</span>'
        +'</div>';
      }).join('');
      return '<div style="margin-bottom:6px;">'
        +'<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;">'
          +'<span style="width:20px;height:20px;border-radius:6px;background:var(--teal);color:#fff;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">'+(ridx+1)+'</span>'
          +'<span style="font-size:12px;font-weight:800;color:var(--teal-dark);">'+esc(r.nomi)+' — '+r.pardalar.length+' ta parda</span>'
        +'</div>'
        +pRows
      +'</div>';
    }).join('');
    return '<div class="rcpt-section">'
      +'<div class="rcpt-section-title">📐 O\'lchamlar</div>'
      +body
    +'</div>';
  }
  var rows=data.rows||{mahsulot:[],tikish:[],ustanovka:[]};
  return '<div class="rcpt-header">'
      +'<div class="rcpt-title">🧵 Parda kalkulyatori</div>'
      +'<div class="rcpt-sub">ID: '+esc(data.receiptNumber||'—')+' · '+esc(data.date?receiptDateTime(data.date):data.dateStr||'')+'</div>'
    +'</div>'
    +'<div class="rcpt-client">'
      +'<div><strong>Mijoz:</strong> '+esc(data.ism)+'</div>'
      +'<div><strong>Manzil:</strong> '+esc(data.manzil)+'</div>'
      +'<div><strong>Tel:</strong> '+esc(data.tel)+'</div>'
    +'</div>'
    +makeRoomsHtml()
    +(rows.mahsulot.length?
    '<div class="rcpt-section">'
      +'<div class="rcpt-section-title">📦 Harajatlar</div>'
      +makeRows(rows.mahsulot)
    +'</div>':'')
    +(rows.tikish.length?
    '<div class="rcpt-section">'
      +'<div class="rcpt-section-title rcpt-section-title-amber">✂️ Tikish xizmati</div>'
      +makeRows(rows.tikish)
    +'</div>':'')
    +(rows.ustanovka.length?
    '<div class="rcpt-section">'
      +'<div class="rcpt-section-title rcpt-section-title-purple">🔧 O\'rnatish xizmati</div>'
      +makeRows(rows.ustanovka)
    +'</div>':'')
    +'<div class="rcpt-totals">'
      +'<div class="rcpt-tot-line"><span>📦 Harajatlar</span><span>'+fmt(data.mS)+'</span></div>'
      +'<div class="rcpt-tot-div"></div>'
      +'<div class="rcpt-tot-line"><span>✂️ Tikish</span><span>'+fmt(data.tS)+'</span></div>'
      +'<div class="rcpt-tot-line"><span>🔧 O\'rnatish</span><span>'+fmt(data.uS)+'</span></div>'
      +'<div class="rcpt-xizmat"><span>Xizmat haqi jami</span><span>'+fmt(data.xizmat)+'</span></div>'
      +'<div class="rcpt-grand"><span>💰 JAMI</span><span>'+fmt(data.grand)+'</span></div>'
    +'</div>'
    +'<div class="rcpt-footer">"Lobar" pardalar uyi tomonidan hisoblab berildi</div>';
}

// iPhone/iPad'ni aniqlash — Safari'da <a download> ishlamaydi (rasm Files'ga tushadi,
// lekin Galereyaga (Photos) TUSHMAYDI). Shu sabab iOS'da alohida yo'l kerak.
function isIOSDevice(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}

// 2-band (yangilangan): AVVAL fayl telefon xotirasiga (Yuklab olinganlar/Fayllar)
// avtomatik saqlanadi, SO'NGRA ulashish oynasi ochiladi — foydalanuvchi istasa
// WhatsApp/Telegram/Gmail va h.k. orqali yuborishi mumkin, istamasa ham fayl
// allaqachon saqlangan bo'ladi.
// iPhone/iPad'da <a download> Galereyaga tushmaydi (faqat Safari'ning "Fayllar"
// bo'limiga), shu sabab u yerda "Ulashish" oynasidagi "Rasmni saqlash" tugmasi -
// yagona ishonchli saqlash yo'li, shuning uchun iOS'da faqat ulashish ochiladi.
function downloadJpgFromReceipt(rcpt, ism, dateForName, onDone){
  if(typeof html2canvas === 'undefined'){
    showSnack("❌ JPG mexanizmi yuklanmagan. Sahifani qayta yuklab ko'ring.");
    return;
  }
  showLoading('📸 Rasm tayyorlanmoqda...');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      html2canvas(rcpt, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      }).then(function(canvas){
        var safeIsm=(ism||'mijoz').replace(/\s+/g,'_').replace(/[^\w-]/g,'');
        var fileName='hisob_'+dateForName.getFullYear()+(dateForName.getMonth()+1<10?'0':'')+(dateForName.getMonth()+1)+(dateForName.getDate()<10?'0':'')+dateForName.getDate()+'_'+(safeIsm||'mijoz')+'.jpg';
        hideLoading();

        if(isIOSDevice()){
          // iOS: "Ulashish" oynasidagi "Rasmni saqlash" - saqlashning o'zi shu.
          canvas.toBlob(function(blob){
            if(!blob){ iosImageFallback(canvas); if(onDone)onDone(); return; }
            var file=new File([blob], fileName, {type:'image/jpeg'});
            if(navigator.canShare && navigator.canShare({files:[file]})){
              navigator.share({files:[file], title: fileName}).then(function(){
                showSnack('✅ Endi "Rasmni saqlash"ni tanlang');
                if(onDone)onDone();
              }).catch(function(err){
                if(!(err && err.name==='AbortError')) iosImageFallback(canvas);
                if(onDone)onDone();
              });
            } else {
              iosImageFallback(canvas);
              if(onDone)onDone();
            }
          }, 'image/jpeg', 0.95);
        } else {
          // Android / kompyuter: AVVAL avtomatik saqlaymiz...
          fallbackSaveCanvas(canvas, fileName);
          // ...SO'NGRA (qo'llab-quvvatlansa) ulashish oynasini ham ochamiz
          canvas.toBlob(function(blob){
            if(!blob){ if(onDone)onDone(); return; }
            var file=new File([blob], fileName, {type:'image/jpeg'});
            if(navigator.canShare && navigator.canShare({files:[file]})){
              setTimeout(function(){
                navigator.share({files:[file], title: fileName}).catch(function(){
                  // Foydalanuvchi ulashish oynasini yopgan yoki qo'llab-quvvatlanmagan bo'lishi
                  // mumkin - muammo emas, fayl allaqachon saqlab bo'lingan.
                });
              }, 450);
            }
            if(onDone)onDone();
          }, 'image/jpeg', 0.95);
        }
      }).catch(function(err){
        hideLoading();
        console.error('html2canvas xatosi:', err);
        showSnack('❌ Xato yuz berdi');
      });
    });
  });
}
function fallbackSaveCanvas(canvas, fileName){
  var link=document.createElement('a');
  link.download=fileName;
  link.href=canvas.toDataURL('image/jpeg',0.95);
  link.click();
  showSnack('✅ JPG saqlandi!');
}

// Agar Web Share API mavjud bo'lmasa (eski Safari) - rasmni yangi oynada to'liq ochamiz,
// foydalanuvchi rasmni bosib turib "Rasmni saqlash" (Save Image) ni tanlab, Galereyaga qo'shadi.
function iosImageFallback(canvas){
  var dataUrl=canvas.toDataURL('image/jpeg',0.95);
  var win=window.open();
  if(win && win.document){
    win.document.write(
      '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head>'
      +'<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;">'
      +'<img src="'+dataUrl+'" style="max-width:100%;height:auto;display:block;"/>'
      +'</body></html>'
    );
    win.document.close();
    showSnack("📸 Rasmni bosib turing va \"Rasmni saqlash\"ni tanlang");
  } else {
    showSnack("⚠️ Rasmni ochib bo'lmadi (popup bloklangan bo'lishi mumkin)");
  }
}

function exportJPG(){
  var ismVal=(document.getElementById('mijoz-ism').value||'').trim();
  var manzilVal=(document.getElementById('mijoz-manzil').value||'').trim();
  var telVal=(document.getElementById('mijoz-tel').value||'').trim();
  var telDigits=normPhone(telVal);

  if(!ismVal||!manzilVal||!telDigits||telDigits.length<12){
    switchPage('mahsulotlar');
    showSnack("⚠️ Mijoz ism, manzil va tel raqamini to'liq kiriting");
    var firstBad=!ismVal?'mijoz-ism':(!manzilVal?'mijoz-manzil':'mijoz-tel');
    var el=document.getElementById(firstBad);
    if(el){el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});}
    return;
  }
  var mSCheck=getSum('mahsulot'),tSCheck=getSum('tikish'),uSCheck=getSum('ustanovka');
  var hasRows=calcRows.mahsulot.length||calcRows.tikish.length||calcRows.ustanovka.length;
  if(!hasRows||(mSCheck+tSCheck+uSCheck)<=0){
    showSnack("⚠️ Hisobda hech qanday mahsulot yoki xizmat yo'q");
    return;
  }

  var ism=ismVal||'—';
  var manzil=manzilVal||'—';
  var tel=telVal||'—';
  var tayyorSana=document.getElementById('mijoz-tayyor-sana').value||'';
  var mS=getSum('mahsulot'),tS=getSum('tikish'),uS=getSum('ustanovka');
  var xizmat=tS+uS,grand=mS+xizmat;
  var now=new Date();
  var dateStr=now.getDate()+'/'+(now.getMonth()+1)+'/'+now.getFullYear()
    +' '+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();

  // Buyurtmani tarixga (telefon xotirasiga) saqlaymiz - mijozning tel raqami
  // bo'yicha keyinchalik Tarix bo'limidan qidirib topish mumkin bo'ladi.
  function snapshotRows(type){
    return calcRows[type].map(function(row){
      var prod=products.find(function(p){return p.id===row.prodId;});
      var price=costRowPrice(row);
      if(prod)bumpUsage(prod.id);
      // prodId ham saqlanadi - keyinchalik shu buyurtmani "O'zgartirish" orqali
      // qayta ochganda, qatorlarni mahsulotlarga to'g'ri bog'lab qaytarish uchun.
      return {costPardaId:row.costPardaId,linkParda:row.linkParda,autoSync:row.autoSync,roomId:row.roomId==null?null:row.roomId,name:prod?prod.name:'?',price:price,miqdor:row.miqdor,sum:row.miqdor*price,prodId:prod?prod.id:null};
    });
  }
  function snapshotRooms(){
    return rooms.filter(function(r){return (r.pardalar||[]).length;}).map(function(r){
      return {
        id:r.id, nomi: r.nomi,
        pardalar: r.pardalar.map(function(p){
          return {id:p.id,tur:p.tur||'deraza', boyi:p.boyi, eni:p.eni, karniz:p.karniz, rang:p.rang};
        })
      };
    });
  }

  ensureOrderNumbers();
  var previous=orderEditId?orders.find(function(o){return o.id===orderEditId;}):null;
  var receiptId=previous?previous.id:now.getTime()+'_'+Math.random().toString(36).slice(2,7);
  var number;try{number=previous?previous.receiptNumber:nextReceiptNumber(now);}catch(e){showSnack(e.message);return;}
  var rcptData={
    receiptNumber:number,
    id:receiptId,date:previous?previous.date:now.getTime(),
    ism:ism, manzil:manzil, tel:tel, dateStr:dateStr,
    rooms:snapshotRooms(),
    rows:{mahsulot:snapshotRows('mahsulot'), tikish:snapshotRows('tikish'), ustanovka:snapshotRows('ustanovka')},
    mS:mS, tS:tS, uS:uS, xizmat:xizmat, grand:grand
  };

  var rcpt=document.getElementById('receipt-area');
  rcpt.innerHTML=buildReceiptHtml(rcptData);

  var andozaSnapshot=andozaImages.map(function(a){return {src:a.src, caption:a.caption||''};});
  var wasEdit=false;

  if(orderEditId){
    // TAHRIRLASH REJIMI: yangi buyurtma qo'shmaymiz - mavjudini yangilaymiz,
    // shu bilan dublikat bo'lib saqlanib qolishining oldi olinadi.
    // id, yaratilgan sana (date/dateStr) va to'lovlar (payments), status - o'zgarmasdan saqlanadi.
    var existing=orders.find(function(o){return o.id===orderEditId;});
    if(existing){
      existing.ism=ism; existing.manzil=manzil; existing.tel=tel; existing.tayyorSana=tayyorSana;
      existing.rooms=rcptData.rooms; existing.rows=rcptData.rows; existing.andoza=andozaSnapshot;
      existing.mS=mS; existing.tS=tS; existing.uS=uS; existing.xizmat=xizmat; existing.grand=grand;
      existing.editedAt=now.getTime();
      existing.editedDateStr=dateStr;
      wasEdit=true;
    }
    orderEditId=null;
    hideEditBanner();
    renderSaqlash();
  }
  if(!wasEdit){
    orders.unshift({
      id: receiptId,
      receiptNumber:number,
      date: now.getTime(),
      dateStr: dateStr,
      ism: ism, manzil: manzil, tel: tel,
      tayyorSana: tayyorSana,
      rooms: rcptData.rooms,
      rows: rcptData.rows,
      andoza: andozaSnapshot,
      payments: [],
      status: {},
      tikuvchiIsmi: '',
      mS:mS, tS:tS, uS:uS, xizmat:xizmat, grand:grand
    });
  }
  saveOrders();
  saveUsage();
  renderQuickAdd('mahsulot');renderQuickAdd('tikish');renderQuickAdd('ustanovka');

  showSnack(wasEdit ? '✅ Buyurtma yangilandi (dublikat bo\'lmadi), rasm tayyorlanmoqda...' : '📸 Rasm tayyorlanmoqda...');

  downloadJpgFromReceipt(rcpt, ism, now, function(){
    // Agar tayyor bo'lish sanasi tanlangan bo'lsa - kalendar eslatma faylini ham yuklaymiz.
    if(tayyorSana){
      setTimeout(function(){
        downloadReminderIcs({ism:ism, tel:tel, sana:tayyorSana});
        showSnack('📅 Eslatma fayli ham yuklandi — uni oching va taqvimga qo\'shing');
      }, 700);
    }
  });
}

// Tarixdagi eski buyurtmani qayta JPG qilib yuklab olish ("Qayta saqlash")
function redownloadOrderJPG(id){
  ensureOrderNumbers();
  var o=orders.find(function(x){return x.id===id;});
  if(!o)return;
  var rcpt=document.getElementById('receipt-area');
  rcpt.innerHTML=buildReceiptHtml(o);
  showSnack('📸 Rasm tayyorlanmoqda...');
  downloadJpgFromReceipt(rcpt, o.ism, new Date(o.date));
}

// ---- KALENDAR ESLATMASI (.ics) ----
// Standart .ics fayl - telefonning o'zining taqvim ilovasiga (Samsungda - Samsung
// Calendar, iPhone'da - Apple Calendar) ochiladi va o'sha ilova eslatma yuboradi:
// 1 kun oldin va tayyor bo'lish kuni ertalab soat 10:00 da.
function pad2(n){return n<10?'0'+n:''+n;}
function icsDateTime(y,mo,da,h,mi){return ''+y+pad2(mo)+pad2(da)+'T'+pad2(h)+pad2(mi)+'00';}
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
function downloadReminderIcs(info){
  if(!info.sana)return;
  var parts=info.sana.split('-');
  var y=parseInt(parts[0],10), mo=parseInt(parts[1],10), da=parseInt(parts[2],10);
  if(!y||!mo||!da)return;
  var dtStart=icsDateTime(y,mo,da,10,0);
  var dtEnd=icsDateTime(y,mo,da,10,30);
  var now=new Date();
  var stamp=icsDateTime(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours(),now.getMinutes());
  var uid='parda-'+now.getTime()+'@lobar';
  var title='Buyurtma topshirish: '+(info.ism||'Mijoz');
  var desc='Mijoz: '+(info.ism||'—')+'\nTelefon: '+(info.tel||'—')+'\nTayyor bo\'lish sanasi: '+info.sana;
  var ics=[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parda Kalkulyatori//UZ',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+uid,
    'DTSTAMP:'+stamp,
    'DTSTART:'+dtStart,
    'DTEND:'+dtEnd,
    'SUMMARY:'+icsEscape(title),
    'DESCRIPTION:'+icsEscape(desc),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:'+icsEscape('Ertaga topshirish kuni: '+(info.ism||'Mijoz')+' ('+(info.tel||'')+')'),
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:'+icsEscape('Bugun topshirish kuni: '+(info.ism||'Mijoz')+' ('+(info.tel||'')+')'),
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  var blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a');
  var safeIsm=(info.ism||'mijoz').replace(/\s+/g,'_').replace(/[^\w-]/g,'');
  link.download='eslatma_'+info.sana+'_'+safeIsm+'.ics';
  link.href=url;
  link.click();
  setTimeout(function(){URL.revokeObjectURL(url);},4000);
}
