// ============================================================
// BACKUP.JS — zaxira nusxa (JSON) eksport/import
// ============================================================

function exportBackup(){
  var data={
    app:'parda_kalkulyatori', version:1, exportedAt:new Date().toISOString(),
    orders: orders, products: products, rooms: rooms,
    andoza: andozaImages, client: clientData, usage: productUsage
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
    if(!confirm("Zaxiradan tiklaymizmi? Joriy tarix va mahsulotlar ustidan YOZILADI (almashtiriladi). Davom etamizmi?")){
      document.getElementById('backup-file').value='';
      return;
    }
    if(Array.isArray(data.orders))orders=data.orders;
    if(Array.isArray(data.products))products=data.products;
    if(Array.isArray(data.rooms))rooms=data.rooms;
    if(Array.isArray(data.andoza))andozaImages=data.andoza.map(function(x){return (typeof x==='string')?{src:x,caption:''}:x;});
    if(data.client)clientData=data.client;
    if(data.usage)productUsage=data.usage;
    saveOrders();savePr();saveRooms();saveAndoza();saveUsage();
    safeSetLS('parda_client', clientData);
    if(clientData.ism)document.getElementById('mijoz-ism').value=clientData.ism;
    if(clientData.manzil)document.getElementById('mijoz-manzil').value=clientData.manzil;
    document.getElementById('mijoz-tel').value=clientData.tel||'+998';
    if(clientData.tayyorSana)document.getElementById('mijoz-tayyor-sana').value=clientData.tayyorSana;
    renderTarix();renderAllRows();renderRooms();renderAndoza();
    showSnack("✅ Zaxiradan tiklandi");
    document.getElementById('backup-file').value='';
  };
  reader.readAsText(file);
}
