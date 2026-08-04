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
var editingId = null;
var selectedBolim = 'mahsulot';
var filterVal = 'all';
var rowCnt = 0;
var roomCnt = 0;
var pardaCnt = 0;

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

if(products === null){
  products = [
    {id:1,name:'Material',bolim:'mahsulot',price:40000,unit:'m'},
    {id:2,name:'Latta',bolim:'mahsulot',price:3250,unit:'m'},
    {id:3,name:'Karniz',bolim:'mahsulot',price:50000,unit:'dona'},
    {id:4,name:'Perdakit',bolim:'mahsulot',price:5500,unit:'dona'},
    {id:5,name:'Bir balo',bolim:'mahsulot',price:250,unit:'dona'},
    {id:6,name:'Kvars',bolim:'mahsulot',price:55000,unit:'m'},
    {id:7,name:'Karsaj',bolim:'mahsulot',price:25000,unit:'m'},
    {id:8,name:'Kadefe',bolim:'mahsulot',price:30000,unit:'m'},
    {id:9,name:'Himoya',bolim:'mahsulot',price:35000,unit:'m'},
    {id:10,name:'Xalqa',bolim:'mahsulot',price:1000,unit:'dona'},
    {id:11,name:'Kupala',bolim:'mahsulot',price:5000,unit:'m'},
    {id:12,name:'Baget',bolim:'mahsulot',price:35000,unit:'m'},
    {id:13,name:'Tesma',bolim:'mahsulot',price:5000,unit:'m'},
    {id:14,name:'Magnit',bolim:'mahsulot',price:25000,unit:'juft'},
    {id:15,name:'Konfet bubi',bolim:'mahsulot',price:100000,unit:'dona'},
    {id:16,name:'Derjalka',bolim:'mahsulot',price:25000,unit:'dona'},
    {id:17,name:'Bubon',bolim:'mahsulot',price:45000,unit:'dona'},
    {id:18,name:'Karniz 1 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:19,name:'Karniz 2 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:20,name:'Karniz 3 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:21,name:'Karniz 4 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:22,name:'Ust. Karniz 1',bolim:'ustanovka',price:50000,unit:'m'},
    {id:23,name:'Ust. Karniz 2',bolim:'ustanovka',price:50000,unit:'m'},
    {id:24,name:'Ust. Karniz 3',bolim:'ustanovka',price:50000,unit:'m'},
    {id:25,name:'Ust. Karniz 4',bolim:'ustanovka',price:50000,unit:'m'}
  ];
  savePr();
}

// ---- SAQLASH FUNKSIYALARI (barchasi try/catch bilan himoyalangan) ----
function savePr(){safeSetLS('parda_products', products);}
function saveCalc(){safeSetLS('parda_calc', calcRows);}
function saveOrders(){safeSetLS('parda_orders', orders);}
function saveRooms(){safeSetLS('parda_rooms', rooms);}
function saveAndoza(){safeSetLS('parda_andoza', andozaImages);}
function saveUsage(){safeSetLS('parda_usage', productUsage);}
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
