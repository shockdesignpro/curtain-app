// ============================================================
// ANDOZA.JS — mijoz tanlagan namuna rasmlarini yuklash.
// 1-QADAM: rasm localStorage'ga tushishidan oldin <canvas> orqali
// kichraytirilib va siqilib saqlanadi — bu localStorage joyini
// (odatda 5-10MB chegara) tez to'ldirib yubormasligi uchun juda muhim.
// ============================================================

var ANDOZA_MAX_SIDE = 1000;   // eng katta tomon shu piksedan oshmaydi
var ANDOZA_QUALITY  = 0.72;   // JPEG siqish sifati (0-1)

// Faylni o'qib, canvas orqali kichraytirib-siqib, JPEG data-URL qaytaradi
function compressImageFile(file){
  return new Promise(function(resolve, reject){
    var reader = new FileReader();
    reader.onerror = function(){ reject(new Error('Fayl o\'qilmadi')); };
    reader.onload = function(e){
      var img = new Image();
      img.onerror = function(){ reject(new Error('Rasm ochilmadi')); };
      img.onload = function(){
        var w = img.width, h = img.height;
        var scale = Math.min(1, ANDOZA_MAX_SIDE / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext('2d');
        // Shaffof PNG bo'lsa ham chek/JPG'da oq fon chiroyli ko'rinishi uchun
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,cw,ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        try{
          resolve(canvas.toDataURL('image/jpeg', ANDOZA_QUALITY));
        }catch(err){
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function onAndozaFiles(files){
  if(!files||!files.length)return;
  var fileArr = Array.prototype.slice.call(files);
  showSnack('📷 Rasmlar siqilmoqda...');
  Promise.all(fileArr.map(function(file){
    return compressImageFile(file).catch(function(err){
      console.error('Rasm siqishda xato:', err);
      return null; // bitta rasm muvaffaqiyatsiz bo'lsa, qolganlari davom etsin
    });
  })).then(function(results){
    var ok = 0;
    results.forEach(function(src){
      if(src){ andozaImages.push({src:src, caption:''}); ok++; }
    });
    if(ok){
      saveAndoza();renderAndoza();
      showSnack('✅ '+ok+" ta rasm yuklandi (siqilgan holda)");
    } else {
      showSnack("❌ Rasm(lar)ni yuklab bo'lmadi");
    }
  });
  document.getElementById('andoza-file').value='';
}
function removeAndoza(idx){
  andozaImages.splice(idx,1);
  saveAndoza();renderAndoza();
}
function setAndozaCaption(idx,val){
  if(andozaImages[idx]){andozaImages[idx].caption=val;saveAndoza();}
}
function renderAndoza(){
  var grid=document.getElementById('andoza-grid');
  var empty=document.getElementById('andoza-empty');
  if(!andozaImages.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=andozaImages.map(function(a,idx){
    return '<div style="position:relative;width:84px;">'
      +'<div style="position:relative;width:84px;height:84px;">'
        +'<img src="'+a.src+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:1.5px solid var(--border);"/>'
        +'<button onclick="removeAndoza('+idx+')" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;border:none;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>'
      +'</div>'
      +'<input type="text" value="'+esc(a.caption||'')+'" placeholder="Belgi qo\'ying" '
        +'onchange="setAndozaCaption('+idx+',this.value)" '
        +'style="width:100%;margin-top:4px;padding:4px 6px;font-size:10px;border:1.5px solid var(--border);border-radius:6px;font-family:var(--font);box-sizing:border-box;text-align:center;color:var(--text);"/>'
    +'</div>';
  }).join('');
}
