// ============================================================
// XONA.JS — xona va parda (deraza) o'lchamlari
// ============================================================

function addRoom(){
  var id=++roomCnt;
  var pid=++pardaCnt;
  rooms.push({id:id,nomi:ROOM_NOMI[0],pardalar:[{id:pid,boyi:'',eni:'',karniz:KARNIZ_TUR[0],rang:XONA_RANG[0]}]});
  activeCostRoom=id;saveRooms();renderRooms();
}
function removeRoom(id){
  var r=rooms.find(function(x){return x.id===id;});
  if(r){
    var pardaIds=(r.pardalar||[]).map(function(p){return p.id;});
    unlinkPardaRows(pardaIds);
  }
  ['mahsulot','tikish','ustanovka'].forEach(function(t){calcRows[t]=calcRows[t].filter(function(row){return String(row.roomId)!==String(id);});});
  rooms=rooms.filter(function(r){return r.id!==id;});
  saveRooms();saveCalc();renderRooms();renderAllRows();
}
function onRoomField(id,field,val){
  var r=rooms.find(function(x){return x.id===id;});
  if(r){r[field]=val;saveRooms();}
}

// Bitta xonada bir nechta deraza va/yoki eshik (parda) bo'lishi mumkin.
// Har biri o'z turi bo'yicha alohida raqamlanadi: Deraza 1, Deraza 2, Eshik 1, Deraza 3, Eshik 2...
function addParda(roomId, tur){
  tur = (tur==='eshik') ? 'eshik' : 'deraza';
  var r=rooms.find(function(x){return x.id===roomId;});
  if(!r)return;
  var id=++pardaCnt;
  r.pardalar.push({id:id,tur:tur,boyi:'',eni:'',karniz:KARNIZ_TUR[0],rang:XONA_RANG[0]});
  saveRooms();renderRooms();
}
function pardaTypeName(tur){ return tur==='eshik' ? 'Eshik' : 'Deraza'; }
function pardaTypeIcon(tur){ return tur==='eshik' ? '🚪' : '🪟'; }
// pardalar ro'yxati va indeks bo'yicha "🪟 Deraza 2" yoki "🚪 Eshik 1" kabi
// yorliq hisoblaydi — har bir tur o'zicha alohida sanaladi.
// Eski (turi saqlanmagan) ma'lumotlar ham xato bermasligi uchun tur bo'lmasa 'deraza' deb olinadi.
function pardaLabel(pardalar, idx){
  var item=pardalar[idx];
  var tur=(item&&item.tur)||'deraza';
  var count=0;
  for(var i=0;i<=idx;i++){
    var t=(pardalar[i]&&pardalar[i].tur)||'deraza';
    if(t===tur)count++;
  }
  return pardaTypeIcon(tur)+' '+pardaTypeName(tur)+' '+count;
}
function removeParda(roomId,pardaId){
  var r=rooms.find(function(x){return x.id===roomId;});
  if(!r)return;
  r.pardalar=r.pardalar.filter(function(p){return p.id!==pardaId;});
  unlinkPardaRows([pardaId]);
  saveRooms();saveCalc();renderRooms();renderAllRows();
}
function unlinkPardaRows(pardaIds){
  ['mahsulot','tikish','ustanovka'].forEach(function(type){
    calcRows[type]=calcRows[type].filter(function(row){return pardaIds.indexOf(row.linkParda)===-1&&pardaIds.indexOf(row.costPardaId)===-1;});
  });
}
// 6-band: bo'yi/eni maydonlariga son validatsiyasi. Kiritishni bloklamaydi (foydalanuvchi
// hali yozib bo'lmagan bo'lishi mumkin), lekin shubhali qiymatda ogohlantiradi.
function onPardaField(roomId,pardaId,field,val){
  var r=rooms.find(function(x){return x.id===roomId;});
  if(!r)return;
  var p=r.pardalar.find(function(x){return x.id===pardaId;});
  if(!p)return;
  if((field==='boyi'||field==='eni') && String(val).trim()!==''){
    var num=parseMq(val);
    var label=field==='boyi'?"Bo'yi":'Eni';
    if(!num||num<=0){
      showSnack("⚠️ "+label+" musbat son bo'lishi kerak");
    } else if(num>100){
      showSnack("⚠️ "+label+" juda katta ko'rinadi ("+num+" m) — tekshirib ko'ring");
    }
  }
  p[field]=val;
  saveRooms();
  if(field==='eni') syncEniToServices(pardaId,val);
}
// "Eni" o'lchamini Tikish va O'rnatish xizmati qatorlariga avtomatik dublikat qiladi
// (miqdorni o'zgartirilsa, sinxronlash to'xtaydi - qo'lda tahrirlash imkoniyati saqlanadi)
function syncEniToServices(pardaId,eniVal){
  var q=parseMq(eniVal);
  ['tikish','ustanovka'].forEach(function(type){
    var row=calcRows[type].find(function(r){return r.linkParda===pardaId;});
    if(row){
      if(row.autoSync!==false){row.miqdor=q;}
    } else {
      var prods=products.filter(function(p){return p.bolim===type;});
      if(prods.length){
        var id=++rowCnt;
        calcRows[type].push({id:id,prodId:prods[0].id,miqdor:q,price:prods[0].price,roomId:(rooms.find(function(room){return room.pardalar.some(function(p){return p.id===pardaId;});})||{}).id,linkParda:pardaId,autoSync:true});
      }
    }
  });
  saveCalc();renderAllRows();
}
function renderRooms(){
  var list=document.getElementById('room-list');
  var empty=document.getElementById('room-empty');
  if(!rooms.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=rooms.map(function(r,idx){
    function options(values,current){return values.map(function(v){return '<option value="'+esc(v)+'"'+(v===current?' selected':'')+'>'+esc(v)+'</option>';}).join('');}
    var curtains=(r.pardalar||[]).map(function(p,pidx){
      var prefix='parda-'+r.id+'-'+p.id+'-';
      function field(key,label,type,values){
        var handler="onPardaField("+r.id+","+p.id+",'"+key+"',this.value)";
        var control=type==='select'?'<select id="'+prefix+key+'" class="fi" onchange="'+handler+'">'+options(values,p[key])+'</select>'
          :'<input id="'+prefix+key+'" class="fi" type="text" inputmode="decimal" placeholder="0.00" value="'+esc(p[key])+'" oninput="'+handler+'"/>';
        return '<div><label for="'+prefix+key+'">'+label+'</label>'+control+'</div>';
      }
      return '<div class="window-block"><div class="window-title"><span>'+pardaLabel(r.pardalar,pidx)+'</span>'
        +(r.pardalar.length>1?'<button class="del-btn" aria-label="Pardani olib tashlash" onclick="removeParda('+r.id+','+p.id+')">'+icon('close',16)+'</button>':'')
        +'</div><div class="dimension-grid">'+field('boyi','Bo‘yi · m','input')+field('eni','Eni · m','input')+field('karniz','Karniz turi','select',KARNIZ_TUR)+field('rang','Rangi','select',XONA_RANG)+'</div></div>';
    }).join('');
    return '<div class="room-block"><div class="room-top"><span class="room-number">'+String(idx+1).padStart(2,'0')+'</span>'
      +'<input class="fi" aria-label="Xona nomi" placeholder="Xona nomi" maxlength="80" value="'+esc(r.nomi)+'" oninput="onRoomField('+r.id+',\'nomi\',this.value)"/>'
      +'<button class="del-btn" aria-label="Xonani olib tashlash" onclick="removeRoom('+r.id+')">'+icon('trash',16)+'</button></div>'
      +curtains+'<div class="room-actions"><button class="add-row-btn" onclick="addParda('+r.id+',\'deraza\')">+ Deraza</button>'
      +'<button class="add-row-btn" onclick="addParda('+r.id+',\'eshik\')">+ Eshik</button></div></div>';
  }).join('');
}
