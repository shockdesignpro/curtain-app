// ============================================================
// STATE.JS — global holat (state) va localStorage bilan ishlash.
// utils.js dan KEYIN, boshqa modul fayllardan OLDIN yuklanadi.
// ============================================================

// ---- STATE ----
var products = safeGetLS('parda_products', null);
var calcRows = safeGetLS('parda_calc', null) || {mahsulot:[],tikish:[],ustanovka:[]};
var clientData = safeGetLS('parda_client', {});
var orders = safeGetLS('parda_orders', []);
var rooms = safeGetLS('parda_rooms', []);
var andozaImages = safeGetLS('parda_andoza', []).map(function(x){
  return (typeof x==='string')?{src:x,caption:''}:x;
});
var productUsage = safeGetLS('parda_usage', {});

var tarixOpenId = null;
var tarixDateFilter = 'all';
var tarixSortMode = 'yangi';
var tarixPayFilter = 'all'; // 14-band: to'lov holati bo'yicha filtr (all/none/partial/full)
var editingId = null;
var selectedBolim = 'mahsulot';
var filterVal = 'all';
var rowCnt = 0;
var roomCnt = 0;
var pardaCnt = 0;

// Tarixdagi buyurtmani "O'zgartirish" orqali tahrirlashda shu buyurtma id'si
// shu yerga yoziladi. Saqlashda (exportJPG) agar shu qiymat bo'lsa, YANGI
// buyurtma qo'shilmaydi - aksincha, shu id'li buyurtma yangilanadi (dublikat bo'lmasligi uchun).
var orderEditId = null;

// ---- BUYURTMA STATUSI (ishlab chiqarish bosqichlari) ----
// Har bir buyurtmada shu bosqichlar galochka (checkbox) sifatida belgilanadi.
// "tikuvchi" bosqichida qo'shimcha ism maydoni ham bor.
var ORDER_STEPS = [
  {key:'razmer',            label:"Razmer olindi"},
  {key:'sotib_olindi',      label:"Sotib olindi"},
  {key:'tikuvchiga_berildi',label:"Tikuvchiga berildi", hasName:true},
  {key:'bichildi',          label:"Bichildi"},
  {key:'chetlari_tikildi',  label:"Chetlari tikildi"},
  {key:'boy_chiqarildi',    label:"Bo'y chiqarildi"},
  {key:'tepasi_tikildi',    label:"Tepasi tikildi"},
  {key:'dazmolandi',        label:"Dazmolandi"},
  {key:'karniz_ustanovka',  label:"Karniz ustanovka"},
  {key:'parda_ornatish',    label:"Pardani o'rnatish"}
];

['mahsulot','tikish','ustanovka'].forEach(function(t){
  (calcRows[t]||[]).forEach(function(r){ if(r.id>rowCnt) rowCnt=r.id; });
});
rooms.forEach(function(r){
  if(r.id>roomCnt) roomCnt=r.id;
  (r.pardalar||[]).forEach(function(p){ if(p.id>pardaCnt) pardaCnt=p.id; });
});

// Eski formatdagi xonalarni (bitta deraza) yangi formatga (pardalar ro'yxati) o'tkazamiz
var roomsMigrated=false;
rooms.forEach(function(r){
  if(!r.pardalar){
    r.pardalar=[{id:++pardaCnt, boyi:r.boyi||'', eni:r.eni||'', karniz:r.karniz||'Truba', rang:r.rang||'Oq'}];
    delete r.boyi;delete r.eni;delete r.karniz;delete r.rang;
    roomsMigrated=true;
  }
});
if(roomsMigrated) saveRooms();

var ROOM_NOMI=['Mehmonxona','Kuxnya','Spalniy','Detskiy','Balkon'];
var KARNIZ_TUR=['Truba','Baget','Qosh'];
var XONA_RANG=['Oq','Qora','Kulrang','Kumush','Qizil','Pushti','Sariq','Tilla','Jigarrang','Bej','Krem','Ko\'k','Zangori','Yashil','Binafsha','Shokolad'];

// Standart mahsulotlar ro'yxati endi kodda emas, ilova ildizidagi Lobar-katalog.csv faylida
// (alfavit bo'yicha). Uni catalog-sync.js har ochilishda tekshiradi va o'zgargan bo'lsa,
// barcha qurilmalardagi narxlarni yangilaydi. Bu yerda faqat bo'sh ro'yxat bilan boshlaymiz.
if(!Array.isArray(products)) products = [];

// ---- SAQLASH FUNKSIYALARI (barchasi try/catch bilan himoyalangan) ----
function savePr(){return safeSetLS('parda_products', products);}
function saveCalc(){return safeSetLS('parda_calc', calcRows);}
function saveOrders(){return safeSetLS('parda_orders', orders);}
function saveRooms(){return safeSetLS('parda_rooms', rooms);}
function saveAndoza(){return safeSetLS('parda_andoza', andozaImages);}
function saveUsage(){return safeSetLS('parda_usage', productUsage);}
function saveClient(){
  clientData = {
    ism: document.getElementById('mijoz-ism').value,
    manzil: document.getElementById('mijoz-manzil').value,
    tel: document.getElementById('mijoz-tel').value,
    tayyorSana: document.getElementById('mijoz-tayyor-sana').value
  };
  safeSetLS('parda_client', clientData);
}

// Restore client data (sahifa ochilganda)
if(clientData.ism) document.getElementById('mijoz-ism').value = clientData.ism;
if(clientData.manzil) document.getElementById('mijoz-manzil').value = clientData.manzil;
document.getElementById('mijoz-tel').value = clientData.tel || '+998';
if(clientData.tayyorSana) document.getElementById('mijoz-tayyor-sana').value = clientData.tayyorSana;
