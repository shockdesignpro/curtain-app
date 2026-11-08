// ============================================================
// BACKUP.JS — zaxira nusxa (JSON) eksport/import
// ============================================================

function exportBackup(){
  var data={
    app:'parda_kalkulyatori', version:2, exportedAt:new Date().toISOString(),
    orders: orders, products: products, rooms: rooms,
    andoza: andozaImages, client: clientData, usage: productUsage, calc: calcRows
  };
  var blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a');
  var now=new Date();
  link.download='parda_zaxira_'+now.getFullYear()+(now.getMonth()+1<10?'0':'')+(now.getMonth()+1)+(now.getDate()<10?'0':'')+now.getDate()+'.json';
  link.href=url;
  link.click();
  setTimeout(function(){URL.revokeObjectURL(url);},4000);
  showSnack('⬇️ Zaxira fayli yuklandi');
}
// ---- ZAXIRA FAYLNI TEKSHIRISH VA TOZALASH ----
// Tashqaridan kelgan JSON'ga ishonmaymiz: noto'g'ri tuzilma ilovani buzmasligi va
// HTML'ga zararli kod (XSS) kirmasligi uchun har bir qiymat kerakli turga keltiriladi.
function bkStr(v){return v==null?'':String(v);}
function bkNum(v,def){var n=Number(v);return Number.isFinite(n)?n:def;}
function bkId(v){var n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null;}
function bkObj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function bkArr(v){return Array.isArray(v)?v:[];}
var BK_BOLIM=['mahsulot','tikish','ustanovka'];
function sanitizeBackupRooms(list){
  return bkArr(list).filter(function(r){return r&&typeof r==='object'&&bkId(r.id)!==null;}).map(function(r){
    return {id:bkId(r.id),nomi:bkStr(r.nomi),pardalar:bkArr(r.pardalar).filter(function(p){return p&&typeof p==='object'&&bkId(p.id)!==null;}).map(function(p){
      var out={id:bkId(p.id),tur:p.tur==='eshik'?'eshik':'deraza',boyi:bkStr(p.boyi),eni:bkStr(p.eni),karniz:bkStr(p.karniz)||KARNIZ_TUR[0],rang:bkStr(p.rang)||XONA_RANG[0]};
      if(p.autoOff&&typeof p.autoOff==='object')out.autoOff={tikish:!!p.autoOff.tikish,ustanovka:!!p.autoOff.ustanovka};
      return out;
    })};
  });
}
function sanitizeBackupAndoza(list){
  return bkArr(list).map(function(a){var src=safeImgSrc(typeof a==='string'?a:a&&a.src);return src?{src:src,caption:bkStr(a&&a.caption)}:null;}).filter(Boolean);
}
function sanitizeOrderRows(rows){
  var obj=bkObj(rows),out={};
  BK_BOLIM.forEach(function(t){out[t]=bkArr(obj[t]).filter(function(r){return r&&typeof r==='object';}).map(function(r){
    var miqdor=bkNum(r.miqdor,0),price=bkNum(r.price,0);
    return {costPardaId:r.costPardaId==null?undefined:bkStr(r.costPardaId),linkParda:bkId(r.linkParda)||undefined,autoSync:r.autoSync,roomId:r.roomId==null?null:bkStr(r.roomId),
      name:bkStr(r.name),price:price,miqdor:miqdor,sum:bkNum(r.sum,miqdor*price),prodId:bkId(r.prodId)};
  });});
  return out;
}
function sanitizeBackup(data){
  var products=bkArr(data.products).filter(function(p){return p&&typeof p==='object'&&bkId(p.id)!==null&&BK_BOLIM.indexOf(p.bolim)!==-1&&bkStr(p.name).trim();})
    .map(function(p){return {id:bkId(p.id),name:bkStr(p.name),bolim:p.bolim,price:Math.max(0,bkNum(p.price,0)),unit:bkStr(p.unit)||'dona'};});
  var orders=bkArr(data.orders).filter(function(o){return o&&typeof o==='object'&&(typeof o.id==='string'||typeof o.id==='number');}).map(function(o){
    var out=Object.assign({},o);
    ['ism','manzil','tel','tayyorSana','dateStr','editedDateStr','tikuvchiIsmi','receiptNumber'].forEach(function(k){if(out[k]!=null)out[k]=bkStr(out[k]);});
    out.tayyorSana=/^\d{4}-\d{2}-\d{2}$/.test(out.tayyorSana||'')?out.tayyorSana:'';
    out.date=bkNum(o.date,Date.now());
    ['mS','tS','uS','xizmat','grand'].forEach(function(k){out[k]=bkNum(o[k],0);});
    out.rooms=sanitizeBackupRooms(o.rooms);
    out.rows=sanitizeOrderRows(o.rows);
    out.andoza=sanitizeBackupAndoza(o.andoza);
    out.payments=bkArr(o.payments).filter(function(p){return p&&Number.isFinite(Number(p.amount))&&Number(p.amount)>0;}).map(function(p){return {amount:Number(p.amount),date:bkNum(p.date,0),dateStr:bkStr(p.dateStr)};});
    out.status=bkObj(o.status);
    return out;
  });
  var calc={mahsulot:[],tikish:[],ustanovka:[]},rawCalc=bkObj(data.calc);
  BK_BOLIM.forEach(function(t){calc[t]=bkArr(rawCalc[t]).filter(function(r){return r&&typeof r==='object'&&bkId(r.id)!==null&&bkId(r.prodId)!==null;}).map(function(r){
    return {id:bkId(r.id),prodId:bkId(r.prodId),miqdor:Math.max(0,bkNum(r.miqdor,0)),price:r.price==null?null:Math.max(0,bkNum(r.price,0)),
      roomId:r.roomId==null||r.roomId===''?null:bkStr(r.roomId),costPardaId:r.costPardaId==null||r.costPardaId===''?undefined:bkStr(r.costPardaId),linkParda:bkId(r.linkParda)||undefined,autoSync:r.autoSync};
  });});
  var client=bkObj(data.client);
  var usage={};Object.keys(bkObj(data.usage)).forEach(function(k){var n=bkNum(data.usage[k],0);if(bkId(k)!==null&&n>0)usage[k]=n;});
  return {orders:orders,products:products,rooms:sanitizeBackupRooms(data.rooms),andoza:sanitizeBackupAndoza(data.andoza),
    client:{ism:bkStr(client.ism),manzil:bkStr(client.manzil),tel:bkStr(client.tel),tayyorSana:bkStr(client.tayyorSana)},usage:usage,calc:calc};
}
function triggerImportBackup(){
  document.getElementById('backup-file').click();
}
function importBackup(files){
  if(!files||!files.length)return;
  var file=files[0];
  var reader=new FileReader();
  reader.onload=function(e){
    var data;
    try{
      data=JSON.parse(e.target.result);
    }catch(err){
      showSnack("❌ Fayl noto'g'ri formatda");
      document.getElementById('backup-file').value='';
      return;
    }
    if(!data || data.app!=='parda_kalkulyatori' || !Array.isArray(data.orders) || !Array.isArray(data.products)){
      showSnack('Bu Lobar Parda zaxira fayli emas');document.getElementById('backup-file').value='';return;
    }
    showConfirm("Zaxiradan tiklaymizmi? Joriy tarix va mahsulotlar ustidan YOZILADI (almashtiriladi). Davom etamizmi?", {danger:true, okText:'Tiklash'}).then(function(ok){
      if(!ok){
        document.getElementById('backup-file').value='';
        return;
      }
      var clean=sanitizeBackup(data);
      orders=clean.orders;
      products=clean.products;
      rooms=clean.rooms;
      andozaImages=clean.andoza;
      clientData=clean.client;
      calcRows=clean.calc;
      activeCostRoom=undefined;activeCostParda=undefined;
      rowCnt=0;roomCnt=0;pardaCnt=0;
      ['mahsulot','tikish','ustanovka'].forEach(function(k){calcRows[k].forEach(function(r){rowCnt=Math.max(rowCnt,Number(r.id)||0);});});
      rooms.forEach(function(r){roomCnt=Math.max(roomCnt,Number(r.id)||0);(r.pardalar||[]).forEach(function(a){pardaCnt=Math.max(pardaCnt,Number(a.id)||0);});});
      orderEditId=null;localStorage.removeItem('parda_draft_meta');hideEditBanner();saveCalc();
      productUsage=clean.usage;
      saveOrders();savePr();saveRooms();saveAndoza();saveUsage();
      safeSetLS('parda_client', clientData);
      document.getElementById('mijoz-ism').value=clientData.ism||'';
      document.getElementById('mijoz-manzil').value=clientData.manzil||'';
      document.getElementById('mijoz-tel').value=clientData.tel||'+998';
      document.getElementById('mijoz-tayyor-sana').value=clientData.tayyorSana||'';
      renderTarix();renderAllRows();renderRooms();renderAndoza();
      showSnack("✅ Zaxiradan tiklandi");
      document.getElementById('backup-file').value='';
    });
  };
  reader.readAsText(file);
}
