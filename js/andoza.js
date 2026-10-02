// ============================================================
// ANDOZA.JS — mijoz tanlagan namuna rasmlarini yuklash.
// 1-QADAM: rasm localStorage'ga tushishidan oldin <canvas> orqali
// kichraytirilib va siqilib saqlanadi — bu localStorage joyini
// (odatda 5-10MB chegara) tez to'ldirib yubormasligi uchun juda muhim.
// ============================================================

var ANDOZA_MAX_SIDE = 1000;   // eng katta tomon shu piksedan oshmaydi
var ANDOZA_QUALITY  = 0.72;   // JPEG siqish sifati (0-1)

// Faylni o'qib, canvas orqali kichraytirib-siqib, JPEG data-URL qaytaradi.
// 5-band: telefon kamerasi rasmlari ko'pincha EXIF "orientation" metama'lumoti bilan
// saqlanadi (masalan, portret holida olingan rasm asl faylda "yotgan" holda saqlanadi).
// Oddiy <img>+<canvas> usuli buni HISOBGA OLMAYDI va rasm burilib chiqishi mumkin.
// createImageBitmap({imageOrientation:'from-image'}) buni avtomatik to'g'irlaydi -
// shuning uchun avval shu usul sinaladi, qo'llab-quvvatlanmasa eski usulga qaytiladi.
function compressImageFile(file){
  if(window.createImageBitmap){
    return createImageBitmap(file, {imageOrientation:'from-image'})
      .then(function(bitmap){ return drawBitmapToJpeg(bitmap); })
      .catch(function(){
        // Ba'zi eski brauzerlar 'imageOrientation' optsiyasini qo'llamaydi - option'siz urinib ko'ramiz
        return createImageBitmap(file)
          .then(function(bitmap){ return drawBitmapToJpeg(bitmap); })
          .catch(function(){ return compressImageFileLegacy(file); });
      });
  }
  return compressImageFileLegacy(file);
}
function drawBitmapToJpeg(bitmap){
  var w=bitmap.width, h=bitmap.height;
  var scale=Math.min(1, ANDOZA_MAX_SIDE/Math.max(w,h));
  var cw=Math.max(1, Math.round(w*scale));
  var ch=Math.max(1, Math.round(h*scale));
  var canvas=document.createElement('canvas');
  canvas.width=cw; canvas.height=ch;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,cw,ch);
  ctx.drawImage(bitmap,0,0,cw,ch);
  if(bitmap.close) bitmap.close();
  return canvas.toDataURL('image/jpeg', ANDOZA_QUALITY);
}
// Eski uslub (createImageBitmap mavjud bo'lmagan juda eski brauzerlar uchun zaxira yo'l)
function compressImageFileLegacy(file){
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
  var grid=document.getElementById('andoza-grid');var empty=document.getElementById('andoza-empty');
  if(!andozaImages.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=andozaImages.map(function(a,idx){
    return '<div class="sample-tile"><div class="sample-photo"><img src="'+a.src+'" alt="'+esc(a.caption||('Andoza '+(idx+1)))+'"/>'
      +'<button aria-label="Andozani olib tashlash" onclick="removeAndoza('+idx+')">'+icon('close',14)+'</button></div>'
      +'<input type="text" aria-label="Andoza izohi" value="'+esc(a.caption||'')+'" placeholder="Izoh yozing" onchange="setAndozaCaption('+idx+',this.value)"/></div>';
  }).join('');
}
