// ============================================================
// MAIN.JS — sahifa navigatsiyasi, ilovani ishga tushirish.
// Bu fayl ENG OXIRIDA yuklanadi, chunki u boshqa barcha
// modullardagi funksiyalarni chaqiradi.
// ============================================================

// ---- PAGE SWITCH ----
function switchPage(name){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  renderAllRows();
  if(name==='hisob') renderDetailSummary();
  if(name==='saqlash') renderSaqlash();
  if(name==='tarix') renderTarix();
}

// ---- CLEAR ----
function resetAllData(){
  calcRows={mahsulot:[],tikish:[],ustanovka:[]};
  document.getElementById('mijoz-ism').value='';
  document.getElementById('mijoz-manzil').value='';
  document.getElementById('mijoz-tel').value='+998';
  document.getElementById('mijoz-tayyor-sana').value='';
  document.querySelectorAll('#tayyor-chips .chip').forEach(function(c){c.classList.remove('active');});
  clientData={};
  rooms=[];
  andozaImages=[];
  localStorage.removeItem('parda_client');
  localStorage.removeItem('parda_calc');
  localStorage.removeItem('parda_rooms');
  localStorage.removeItem('parda_andoza');
  renderAllRows();
  renderDetailSummary();
  renderRooms();
  renderAndoza();
}
function tozalaHisob(){
  if(!confirm('Hamma ma\'lumotlarni (hisob, mijoz, xonalar, andozalar) tozalash?'))return;
  resetAllData();
  showSnack('🗑️ Tozalandi');
}

// ---- ANDOZA RASM KO'RUVCHI (Tarix bo'limi uchun) ----
function openImageViewer(src){
  var ov=document.getElementById('img-viewer-ov');
  var img=document.getElementById('img-viewer-img');
  if(!ov||!img)return;
  img.src=src;
  ov.classList.add('open');
}
function closeImageViewer(){
  var ov=document.getElementById('img-viewer-ov');
  if(ov)ov.classList.remove('open');
}

// ---- INIT ----
document.getElementById('add-modal').addEventListener('click',function(e){if(e.target===this)closeModal();});

setFilter('all');
renderAllRows();
renderRooms();
renderAndoza();
// Start on mahsulotlar tab as main
switchPage('mahsulotlar');

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js");
}
