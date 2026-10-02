var activeCostRoom=undefined;
var activeCostParda=undefined;
function costRowPrice(row){
  var p=products.find(function(x){return x.id===row.prodId;});
  return row.price!=null?Number(row.price):(p?Number(p.price):0);
}
function normalizeCostRooms(){
  ['mahsulot','tikish','ustanovka'].forEach(function(t){calcRows[t].forEach(function(row){
    if(row.roomId==null&&row.linkParda){var room=rooms.find(function(r){return r.pardalar.some(function(p){return p.id===row.linkParda;});});if(room)row.roomId=room.id;}
  });});
}
function currentCostRoom(){
  normalizeCostRooms();
  if(activeCostRoom!==null&&!rooms.some(function(r){return String(r.id)===String(activeCostRoom);}))activeCostRoom=rooms.length?rooms[0].id:null;
  return activeCostRoom;
}
function isCostRoomRow(row){return String(row.roomId==null?'':row.roomId)===String(currentCostRoom()==null?'':currentCostRoom());}
function currentCostParda(){
 var room=rooms.find(function(r){return String(r.id)===String(currentCostRoom());});
 if(!room||room.pardalar.length<2)return room&&room.pardalar.length?room.pardalar[0].id:null;
 if(activeCostParda!==null&&!room.pardalar.some(function(p){return String(p.id)===String(activeCostParda);}))activeCostParda=room.pardalar[0].id;
 return activeCostParda;
}
function isCurrentCostRow(row){
 if(!isCostRoomRow(row))return false;
 var room=rooms.find(function(r){return String(r.id)===String(currentCostRoom());});
 if(!room||room.pardalar.length<2)return true;
 return String(row.costPardaId||row.linkParda||'')===String(currentCostParda()||'');
}
function selectCostParda(id){activeCostParda=id===''?null:id;renderAllRows();}
function renderCostPardaTabs(room){
 var el=document.getElementById('cost-parda-tabs');if(!el)return;
 if(!room||room.pardalar.length<2){el.innerHTML='';el.hidden=true;return;}
 el.hidden=false;var selected=currentCostParda();
 var choices=room.pardalar.map(function(p,i){return {id:p.id,name:pardaLabel(room.pardalar,i)};});
 if(['mahsulot','tikish','ustanovka'].some(function(t){return calcRows[t].some(function(r){return isCostRoomRow(r)&&!r.costPardaId&&!r.linkParda;});}))choices.push({id:'',name:'Umumiy'});
 el.innerHTML=choices.map(function(p){return '<button type="button" role="tab" aria-selected="'+(String(p.id)===String(selected||''))+'" onclick="selectCostParda(\''+p.id+'\')">'+esc(p.name)+'</button>';}).join('');
}
function costRoomSum(type){return calcRows[type].filter(isCurrentCostRow).reduce(function(s,r){return s+r.miqdor*costRowPrice(r);},0);}
function costDimensions(room){return (room.pardalar||[]).map(function(p,i){return pardaLabel(room.pardalar,i)+': '+p.boyi+' × '+p.eni+' m · '+p.karniz+' · '+p.rang;}).join(' | ');}
function selectCostRoom(id){activeCostRoom=id===''?null:id;activeCostParda=undefined;renderAllRows();}
function renderCostRoomPicker(){
  var select=document.getElementById('cost-room-select');if(!select)return;
  var current=currentCostRoom();
  var unassigned=['mahsulot','tikish','ustanovka'].some(function(t){return calcRows[t].some(function(row){return row.roomId==null;});});
  if(!rooms.length)activeCostRoom=current=null;
  select.innerHTML=rooms.map(function(r,i){return '<option value="'+esc(r.id)+'"'+(String(r.id)===String(current)?' selected':'')+'>'+(i+1)+'. '+esc(r.nomi)+'</option>';}).join('')+((unassigned||!rooms.length||current===null)?'<option value=""'+(current===null?' selected':'')+'>Umumiy / xonaga biriktirilmagan</option>':'');
  select.value=current==null?'':String(current);
  var room=rooms.find(function(r){return String(r.id)===String(current);});
  document.getElementById('cost-room-dimensions').textContent=room?costDimensions(room):'Xonaga biriktirilmagan xarajatlar';
  renderCostPardaTabs(room);
  updateCostRoomTotal();
}
function updateCostRoomTotal(){var el=document.getElementById('cost-room-total');if(el)el.textContent='Shu xona jami: '+fmt(['mahsulot','tikish','ustanovka'].reduce(function(sum,t){return sum+calcRows[t].filter(isCostRoomRow).reduce(function(n,r){return n+r.miqdor*costRowPrice(r);},0);},0));}
function costGroups(data){
  var rows=data.rows||{},list=(data.rooms||[]).map(function(room){return {room:room,name:room.nomi,rows:{mahsulot:[],tikish:[],ustanovka:[]}};});
  var other={room:null,name:'Umumiy xarajatlar',rows:{mahsulot:[],tikish:[],ustanovka:[]}};
  ['mahsulot','tikish','ustanovka'].forEach(function(t){(rows[t]||[]).forEach(function(row){
    var group=row.roomId==null?null:list.find(function(g){return g.room.id!=null&&String(g.room.id)===String(row.roomId);});
    (group||other).rows[t].push(row);
  });});
  if(Object.keys(other.rows).some(function(t){return other.rows[t].length;}))list.push(other);
  return list.map(function(g){Object.keys(g.rows).forEach(function(t){g.rows[t].sort(productAlphabetical);});g.mS=g.rows.mahsulot.reduce(function(s,r){return s+r.sum;},0);g.tS=g.rows.tikish.reduce(function(s,r){return s+r.sum;},0);g.uS=g.rows.ustanovka.reduce(function(s,r){return s+r.sum;},0);g.xizmat=g.tS+g.uS;g.grand=g.mS+g.xizmat;return g;});
}
function currentCostSnapshot(){var rows={};['mahsulot','tikish','ustanovka'].forEach(function(t){rows[t]=calcRows[t].map(function(r){var p=products.find(function(p){return p.id===r.prodId;});return {roomId:r.roomId,name:p?p.name:'?',price:costRowPrice(r),miqdor:r.miqdor,sum:r.miqdor*costRowPrice(r)};});});return {rooms:rooms,rows:rows};}
function roomCostDetailsHtml(data){
  return '<div class="room-cost-groups">'+costGroups(data).map(function(g){
    var dimensions=g.room?costDimensions(g.room):'Xonaga biriktirilmagan xarajatlar';
    return '<details class="card room-cost-detail"><summary><span class="room-cost-name">'+esc(g.name)+'</span><strong>'+fmt(g.grand)+'</strong></summary>'
      +(dimensions?'<p>'+esc(dimensions)+'</p>':'')
      +['mahsulot','tikish','ustanovka'].map(function(t,i){
        var sum=[g.mS,g.tS,g.uS][i];
        return '<h4><span>'+['Xarajatlar','Tikish','O‘rnatish'][i]+'</span><strong>'+fmt(sum)+'</strong></h4>'
          +(g.rows[t].length?g.rows[t].map(function(row){return '<div class="room-cost-line"><span>'+esc(row.name)+'<small>'+fmtN(row.price)+' × '+esc(row.miqdor)+'</small></span><strong>'+fmt(row.sum)+'</strong></div>';}).join(''):'<p class="room-cost-empty">Kiritilmagan</p>');
      }).join('')+'</details>';
  }).join('')+'</div>';
}
function renderRoomCostSummary(){
  var el=document.getElementById('room-cost-summary');if(el)el.innerHTML=roomCostDetailsHtml(currentCostSnapshot());
}
function roomReceiptSections(data){
 return costGroups(data).map(function(g,i){
  var curtains=g.room?(g.room.pardalar||[]):[];
  return '<section class="rcpt-room-group"><h3>'+(i+1)+'. '+esc(g.name)+(g.room?' — '+curtains.length+' ta parda':'')+'</h3>'
   +curtains.map(function(c,j){return '<div class="room-dimension"><span>'+pardaLabel(curtains,j)+' <em>('+esc(c.karniz)+', '+esc(c.rang)+')</em></span><strong>'+esc(c.boyi)+' × '+esc(c.eni)+' m</strong></div>';}).join('')
   +['mahsulot','tikish','ustanovka'].map(function(t,j){return '<div class="room-category category-'+t+'"><span>'+['<span class="room-category-icon">📦</span>Harajatlar','<span class="room-category-icon">✂️</span>Tikish xizmati','<span class="room-category-icon">🔧</span>O‘rnatish xizmati'][j]+'</span><strong>'+fmt([g.mS,g.tS,g.uS][j])+'</strong></div>'+g.rows[t].map(function(r){return '<div class="room-item"><span>'+esc(r.name)+'</span><span>'+fmtN(r.price)+'</span><span>×'+esc(r.miqdor)+'</span><strong>'+fmtN(r.sum)+'</strong></div>';}).join('');}).join('')
   +'<div class="room-grand"><span>JAMI:</span><strong>'+fmt(g.grand)+'</strong></div></section>';
 }).join('');
}
function buildReceiptHtml(data){
 var base=buildReceiptHtmlBase(data),start=base.indexOf('<div class="rcpt-section">'),end=base.indexOf('<div class="rcpt-totals">');
 if(start<0)start=end;
 return base.slice(0,start)+roomReceiptSections(data)+base.slice(end);
}
function ensureOrderNumbers(){
 var seq;try{seq=JSON.parse(localStorage.getItem('parda_sequences')||'{}');}catch(e){seq={};}
 orders.filter(function(o){return o.receiptNumber;}).forEach(function(o){var y=new Date(o.date).getFullYear();seq[y]=Math.max(seq[y]||0,Number(o.receiptNumber)||0);});
 var changed=false;
 orders.slice().sort(function(a,b){return a.date-b.date||String(a.id).localeCompare(String(b.id));}).forEach(function(o){if(!o.receiptNumber){var y=new Date(o.date).getFullYear();o.receiptNumber=String((seq[y]||0)+1).padStart(4,'0');seq[y]=Number(o.receiptNumber);changed=true;}});
 if(!safeSetLS('parda_sequences',seq))throw new Error('ID saqlanmadi');
 if(changed)saveOrders();
 return seq;
}
function nextReceiptNumber(date){
 var seq=ensureOrderNumbers(),y=date.getFullYear(),n=(seq[y]||0)+1;
 if(n>9999)throw new Error('Bu yil uchun 9999 ta ID ishlatilgan');
 seq[y]=n;if(!safeSetLS('parda_sequences',seq))throw new Error('ID saqlanmadi');return String(n).padStart(4,'0');
}

function orderRoomDetails(data){
 return roomReceiptSections(data).replace(/<section class="rcpt-room-group"><h3>/g,'<details class="rcpt-room-group order-room"><summary>').replace(/<\/h3>/g,'</summary>').replace(/<\/section>/g,'</details>');
}
