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

// Bu ro'yxat ilovaga BIRINCHI marta kirgan har bir foydalanuvchi uchun
// boshlang'ich katalog hisoblanadi. Yangi doimiy mahsulotni shu yerga,
// yangi va takrorlanmaydigan ID bilan qo'shing.
var DEFAULT_PRODUCTS = [
    [
    {id:1,name:'Baget',bolim:'mahsulot',price:35000,unit:'m'},
    {id:2,name:'Bir balo',bolim:'mahsulot',price:250,unit:'dona'},
    {id:3,name:'Bubon',bolim:'mahsulot',price:45000,unit:'dona'},
    {id:4,name:'Derjalka',bolim:'mahsulot',price:25000,unit:'dona'},
    {id:5,name:'Himoya',bolim:'mahsulot',price:35000,unit:'m'},
    {id:6,name:'Kadefe',bolim:'mahsulot',price:30000,unit:'m'},
    {id:7,name:'Karniz',bolim:'mahsulot',price:50000,unit:'dona'},
    {id:8,name:'Karniz 1 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:9,name:'Karniz 2 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:10,name:'Karniz 3 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:11,name:'Karniz 4 (tikish)',bolim:'tikish',price:60000,unit:'m'},
    {id:12,name:'Karsaj',bolim:'mahsulot',price:25000,unit:'m'},
    {id:13,name:'Kolechka',bolim:'mahsulot',price:1500,unit:'dona'},
    {id:14,name:'Kolso',bolim:'mahsulot',price:1000,unit:'dona'},
    {id:15,name:'Konfet bubi',bolim:'mahsulot',price:100000,unit:'dona'},
    {id:16,name:'Korset',bolim:'mahsulot',price:4000,unit:'m'},
    {id:17,name:'Kupala',bolim:'mahsulot',price:5000,unit:'m'},
    {id:18,name:'Kvars',bolim:'mahsulot',price:55000,unit:'m'},
    {id:19,name:'Latta',bolim:'mahsulot',price:3250,unit:'m'},
    {id:20,name:'Magnit',bolim:'mahsulot',price:25000,unit:'juft'},
    {id:21,name:'Material',bolim:'mahsulot',price:40000,unit:'m'},
    {id:22,name:'Nojka',bolim:'mahsulot',price:15000,unit:'dona'},
    {id:23,name:'Obxvat',bolim:'mahsulot',price:85000,unit:'dona'},
    {id:24,name:'Perdakit',bolim:'mahsulot',price:5500,unit:'dona'},
    {id:25,name:'Tesma',bolim:'mahsulot',price:5000,unit:'m'},
    {id:26,name:'Truba karniz',bolim:'mahsulot',price:18000,unit:'m'},
    {id:27,name:'Ust. Karniz 1',bolim:'ustanovka',price:50000,unit:'m'},
    {id:28,name:'Ust. Karniz 2',bolim:'ustanovka',price:50000,unit:'m'},
    {id:29,name:'Ust. Karniz 3',bolim:'ustanovka',price:50000,unit:'m'},
    {id:30,name:'Ust. Karniz 4',bolim:'ustanovka',price:50000,unit:'m'},
    {id:31,name:'Xalqa',bolim:'mahsulot',price:1000,unit:'dona'}
];

// Oldin katalog yaratib bo'lgan foydalanuvchilarda products localStorage'da
// saqlangan bo'ladi. Shuning uchun yangi kod mahsulotlari ham ularga bir marta
// qo'shiladi; foydalanuvchining narxi, nomi yoki o'zi qo'shgan mahsulotlari
// ustidan yozilmaydi.
var DEFAULT_PRODUCT_IDS_KEY='parda_default_catalog_ids_v1';
var knownDefaultIds=safeGetLS(DEFAULT_PRODUCT_IDS_KEY,null);
if(!Array.isArray(knownDefaultIds)){
  // 1–25 avvalgi standart katalog edi. Yangi qo'shiladiganlar 26 dan boshlansin.
  knownDefaultIds=DEFAULT_PRODUCTS.filter(function(p){return p.id<=25;}).map(function(p){return p.id;});
}
if(products === null){
  products=DEFAULT_PRODUCTS.map(function(p){return Object.assign({},p);});
  knownDefaultIds=DEFAULT_PRODUCTS.map(function(p){return p.id;});
  savePr();
} else {
  var defaultsAdded=false;
  DEFAULT_PRODUCTS.forEach(function(defaultProduct){
    if(knownDefaultIds.indexOf(defaultProduct.id)!==-1)return;
    var usedId=products.some(function(product){return product.id===defaultProduct.id;});
    var nextId=usedId ? Math.max.apply(null,products.map(function(product){return Number(product.id)||0;}))+1 : defaultProduct.id;
    products.push(Object.assign({},defaultProduct,{id:nextId}));
    knownDefaultIds.push(defaultProduct.id);
    defaultsAdded=true;
  });
  if(defaultsAdded)savePr();
}
safeSetLS(DEFAULT_PRODUCT_IDS_KEY,knownDefaultIds);

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
