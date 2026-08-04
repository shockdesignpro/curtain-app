// ============================================================
// XONA.JS — xona va parda (deraza) o'lchamlari
// ============================================================

function addRoom(){
  var id=++roomCnt;
  var pid=++pardaCnt;
  rooms.push({id:id,nomi:ROOM_NOMI[0],pardalar:[{id:pid,boyi:'',eni:'',karniz:KARNIZ_TUR[0],rang:XONA_RANG[0]}]});
  saveRooms();renderRooms();
}
function removeRoom(id){
  var r=rooms.find(function(x){return x.id===id;});
  if(r){
    var pardaIds=(r.pardalar||[]).map(function(p){return p.id;});
    unlinkPardaRows(pardaIds);
  }
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
  ['tikish','ustanovka'].forEach(function(type){
    calcRows[type]=calcRows[type].filter(function(row){return pardaIds.indexOf(row.linkParda)===-1;});
  });
}
function onPardaField(roomId,pardaId,field,val){
  var r=rooms.find(function(x){return x.id===roomId;});
  if(!r)return;
  var p=r.pardalar.find(function(x){return x.id===pardaId;});
  if(!p)return;
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
        calcRows[type].push({id:id,prodId:prods[0].id,miqdor:q,linkParda:pardaId,autoSync:true});
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
    var nomiOpts=ROOM_NOMI.map(function(n){return '<option value="'+n+'"'+(n===r.nomi?' selected':'')+'>'+n+'</option>';}).join('');
    var pardaHtml=(r.pardalar||[]).map(function(p,pidx){
      var karnizOpts=KARNIZ_TUR.map(function(k){return '<option value="'+k+'"'+(k===p.karniz?' selected':'')+'>'+k+'</option>';}).join('');
      var rangOpts=XONA_RANG.map(function(c){return '<option value="'+c+'"'+(c===p.rang?' selected':'')+'>'+c+'</option>';}).join('');
      return '<div style="border-top:1px dashed var(--border);padding-top:9px;margin-top:9px;">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">'
          +'<span style="font-size:11px;font-weight:800;color:var(--muted);">'+pardaLabel(r.pardalar,pidx)+'</span>'
          +(r.pardalar.length>1?'<button class="del-btn" onclick="removeParda('+r.id+','+p.id+')">✕</button>':'')
        +'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">'
          +'<div><label style="margin-bottom:3px;">Bo\'yi</label><input class="fi" style="padding:8px 10px;font-size:13px;" type="text" inputmode="decimal" placeholder="masalan: 3.2" value="'+esc(p.boyi)+'" onchange="onPardaField('+r.id+','+p.id+',\'boyi\',this.value)"/></div>'
          +'<div><label style="margin-bottom:3px;">Eni</label><input class="fi" style="padding:8px 10px;font-size:13px;" type="text" inputmode="decimal" placeholder="masalan: 2.5" value="'+esc(p.eni)+'" onchange="onPardaField('+r.id+','+p.id+',\'eni\',this.value)"/></div>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
          +'<div><label style="margin-bottom:3px;">Karniz turi</label><select class="fi" style="padding:8px 10px;font-size:13px;" onchange="onPardaField('+r.id+','+p.id+',\'karniz\',this.value)">'+karnizOpts+'</select></div>'
          +'<div><label style="margin-bottom:3px;">Rangi</label><select class="fi" style="padding:8px 10px;font-size:13px;" onchange="onPardaField('+r.id+','+p.id+',\'rang\',this.value)">'+rangOpts+'</select></div>'
        +'</div>'
      +'</div>';
    }).join('');
    return '<div class="card" style="padding:11px;margin-bottom:9px;background:var(--bg);box-shadow:none;border:1.5px solid var(--border);">'
      +'<div style="display:flex;align-items:center;gap:6px;">'
        +'<span style="width:22px;height:22px;border-radius:6px;background:var(--teal);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(idx+1)+'</span>'
        +'<select class="fi" style="flex:1;padding:8px 10px;font-size:13px;" onchange="onRoomField('+r.id+',\'nomi\',this.value)">'+nomiOpts+'</select>'
        +'<button class="del-btn" onclick="removeRoom('+r.id+')">✕</button>'
      +'</div>'
      +pardaHtml
      +'<div style="display:flex;gap:8px;margin-top:10px;">'
        +'<button class="add-row-btn arb-teal" style="margin:0;padding:8px;font-size:12px;flex:1;" onclick="addParda('+r.id+',\'deraza\')">🪟 Deraza qo\'shish</button>'
        +'<button class="add-row-btn arb-teal" style="margin:0;padding:8px;font-size:12px;flex:1;" onclick="addParda('+r.id+',\'eshik\')">🚪 Eshik qo\'shish</button>'
      +'</div>'
    +'</div>';
  }).join('');
}
