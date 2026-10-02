/* Browser adapter. Business logic and receipt markup remain shared with native apps. */
(function(){
  'use strict';
  let busy=false, installEvent, registration;
  const toast=text=>window.showSnack?.(text);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;});
  window.addEventListener('appinstalled',()=>{installEvent=null;toast('Lobar Parda o‘rnatildi');});
  function button(label, action){const b=document.createElement('button');b.type='button';b.className='add-row-btn';b.textContent=label;b.onclick=action;return b;}
  function dialog(title){
    document.getElementById('pwa-dialog')?.remove();
    const overlay=document.createElement('div');overlay.id='pwa-dialog';overlay.className='pwa-overlay';
    const body=document.createElement('section');body.className='pwa-dialog';body.setAttribute('role','dialog');body.setAttribute('aria-modal','true');body.setAttribute('aria-label',title);
    const heading=document.createElement('h3');heading.textContent=title;body.append(heading);overlay.append(body);document.body.append(overlay);
    const previous=document.activeElement;
    const close=()=>{overlay.remove();previous?.focus();};
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const items=body.querySelectorAll('button,a[href]');const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    body.append(button('Yopish',close));setTimeout(()=>body.querySelector('button')?.focus(),0);
    return {body,close};
  }
  function fileActions(file,title,receipt=false){
    const {body}=dialog(title),url=URL.createObjectURL(file);
    const note=document.createElement('p');note.className='input-note';note.textContent=receipt?'Ulashish orqali mijozga yuboring. iPhone/iPad’da rasmni Photos’ga saqlash uchun “Rasmni saqlash”ni tanlang.':'Faylni saqlang yoki boshqa ilovaga yuboring.';body.insertBefore(note,body.lastElementChild);
    if(receipt){const img=document.createElement('img');img.src=url;img.alt='Tayyor chek';img.className='pwa-receipt-preview';body.insertBefore(img,body.lastElementChild);}
    if(navigator.canShare?.({files:[file]}))body.insertBefore(button('Ulashish',async()=>{
      try{await navigator.share({files:[file],title,...(receipt?{text:'Hurmatli mijoz, bizni tanlaganingizdan mamnunmiz!'}:{})});}
      catch(e){if(e.name!=='AbortError')toast('Ulashish ochilmadi. Yuklab olish tugmasidan foydalaning.');}
    }),body.lastElementChild);
    const link=document.createElement('a');link.className='add-row-btn';link.textContent='Yuklab olish';link.href=url;link.download=file.name;body.insertBefore(link,body.lastElementChild);
    // Keep the URL alive while the sheet is open, including a cancelled share.
    const observer=new MutationObserver(()=>{if(!body.isConnected){URL.revokeObjectURL(url);observer.disconnect();}});observer.observe(document.body,{childList:true});
  }
  async function receipt(rcpt,name,date,onDone){
    if(busy)return;busy=true;window.showLoading('Chek tayyorlanmoqda…');
    try{
      const width=rcpt.scrollWidth||480,height=rcpt.scrollHeight||800;
      const canvas=await window.html2canvas(rcpt,{scale:Math.min(3,Math.sqrt(15000000/(width*height)),16384/height),useCORS:true,backgroundColor:'#fff',logging:false});
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));if(!blob)throw new Error('Empty image');
      const filename='hisob_'+date.toISOString().slice(0,10)+'_'+String(name||'mijoz').replace(/[^\p{L}\p{N}_-]/gu,'_')+'.jpg';
      window.completeMobileReceipt(!!onDone);
      fileActions(new File([blob],filename,{type:'image/jpeg'}),'Chek tayyor',true);
    }catch(e){console.error(e);toast('Chekni tayyorlab bo‘lmadi. Buyurtma Buyurtmalar bo‘limida saqlangan.');}
    finally{busy=false;window.hideLoading();}
  }
  const escapeICS=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function calendarText(orders,time){
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lobar Parda//UZ','CALSCALE:GREGORIAN'];
    for(const order of orders){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(order.tayyorSana||'')||order.status?.parda_ornatish)continue;
      lines.push('BEGIN:VEVENT','UID:lobar-'+escapeICS(order.id)+'@parda','DTSTAMP:'+stamp,'DTSTART:'+order.tayyorSana.replace(/-/g,'')+'T'+time.replace(':','')+'00','DURATION:PT30M','SUMMARY:'+escapeICS('Buyurtma topshirish: '+order.ism),'DESCRIPTION:'+escapeICS('Telefon: '+(order.tel||'')),
        'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-P1D','DESCRIPTION:Ertaga buyurtma topshirish','END:VALARM',
        'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0M','DESCRIPTION:Bugun buyurtma topshirish','END:VALARM','END:VEVENT');
    }
    lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n';
  }
  function calendar(){
    const active=(window.orders||[]).filter(o=>o.tayyorSana&&!o.status?.parda_ornatish);
    if(!active.length){toast('Tayyor sanasi belgilangan faol buyurtma yo‘q');return;}
    fileActions(new File([calendarText(active,window.reminderPreferences().reminderTime||'10:00')],'Lobar-eslatmalar.ics',{type:'text/calendar'}),'Taqvim eslatmalari');
  }
  async function install(){
    if(installEvent){const event=installEvent;installEvent=null;await event.prompt();return;}
    const {body}=dialog('Ilovani o‘rnatish');const p=document.createElement('p');p.textContent='iPhone/iPad: Safari → Ulashish → Bosh ekranga qo‘shish. Android: Chrome menyusi → Ilovani o‘rnatish yoki Bosh ekranga qo‘shish.';body.prepend(p);
    try{await navigator.storage?.persist?.();}catch{}
  }
  async function attach(){
    window.downloadJpgFromReceipt=receipt;
    const base=window.exportJPG;window.exportJPG=()=>{if(!busy)return base();};
    window.exportCatalog=()=>fileActions(new File([window.catalogCSV()],'Lobar-katalog.csv',{type:'text/csv;charset=utf-8'}),'Katalogni eksport qilish');
    window.exportBackup=()=>{
      const data={app:'parda_kalkulyatori',version:2,exportedAt:new Date().toISOString(),orders:window.orders,products:window.products,rooms:window.rooms,andoza:window.andozaImages,client:window.clientData,usage:window.productUsage,calc:window.calcRows};
      fileActions(new File([JSON.stringify(data)],'Lobar-zaxira-'+Date.now()+'.json',{type:'application/json'}),'Zaxira nusxa');
    };
    const card=document.querySelector('#page-settings .card');
    card.innerHTML='<h3>Eslatmalar</h3><p class="input-note">Taqvimga qo‘shilgan buyurtmalar bir kun oldin va topshirish kuni eslatiladi. Sana o‘zgarsa, taqvimdagi yozuvni ham yangilang. Ovoz taqvim ilovasida sozlanadi.</p><label for="reminder-time">Eslatma vaqti</label><input id="reminder-time" type="time" value="10:00"><span id="reminder-sound-name" hidden></span>';
    card.append(button('Vaqtni saqlash',()=>window.saveReminderSettings()),button('Taqvimga eksport qilish',calendar));
    const setup=document.createElement('div');setup.className='card';setup.innerHTML='<h3>Lobar Parda PWA</h3><p id="pwa-status" class="input-note">Offline fayllar tayyorlanmoqda…</p><p class="input-note">Buyurtmalar shu qurilmada saqlanadi. Qurilmalar o‘rtasida ko‘chirish uchun zaxira nusxadan foydalaning.</p>';
    setup.append(button('Bosh ekranga o‘rnatish',install),button('Zaxira nusxa olish',()=>window.exportBackup()),button('Zaxiradan tiklash',()=>window.triggerImportBackup()),button('Yangilanishni tekshirish',async()=>{try{await registration?.update();toast(registration?.waiting?'Yangi versiya tayyor. Ilovaning barcha oynalarini yopib, qayta oching.':'Tekshirildi. Yangilanish bo‘lsa, keyingi ochilishda qo‘llanadi.');}catch{toast('Internet ulanishini tekshiring');}}));
    document.getElementById('page-settings').append(setup);
    const hint=document.getElementById('reminder-hint');if(hint)hint.textContent='Eslatmalarni Sozlamalar bo‘limidan taqvimga qo‘shishingiz mumkin.';
    window.requestMobileReminders=calendar;
    if('serviceWorker' in navigator){
      try{registration=await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;document.getElementById('pwa-status').textContent='Offline ishlashga tayyor';}
      catch(e){console.error(e);document.getElementById('pwa-status').textContent='Offline yuklash bajarilmadi. Internet bilan qayta oching.';}
    }
  }
  window.PardaPWA={calendarText};
  window.NativeBridge={isNative:false,ready:Promise.resolve(),attach:()=>{attach().catch(console.error);},persist:()=>{},flush:async()=>{}};
})();
