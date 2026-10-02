// ============================================================
// UI.JS — yangi UI yordamchilari (9-15 bandlar):
//  - SVG ikonkalar registri (icon())
//  - Qorong'i rejim (dark mode)
//  - Maxsus tasdiqlash oynasi (showConfirm) — brauzer confirm() o'rniga
//  - "Bekor qilish" imkoniyatli bildirishnoma (showUndoSnack)
//  - Yuklanish overlay (JPG tayyorlanayotganda)
//  - Markaziy tezkor amallar tugmasi (FAB)
// utils.js dan KEYIN, boshqa UI-ga bog'liq fayllardan OLDIN yuklanadi.
// ============================================================

// ---- SVG IKONKALAR (lucide uslubida, qo'lda chizilgan) ----
var ICONS = {
  user:      '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>',
  scissors:  '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><line x1="8.5" y1="7.5" x2="20" y2="19"/><line x1="8.5" y1="16.5" x2="20" y2="5"/>',
  wrench:    '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/>',
  calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="14"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/>',
  save:      '<path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h8V4"/><rect x="7" y="13" width="10" height="7"/>',
  history:   '<circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/><path d="M5 3 3 6"/>',
  plus:      '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash:     '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  edit:      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  search:    '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  box:       '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  image:     '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  moon:      '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
  sun:       '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/>',
  share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/>',
  check:     '<polyline points="20 6 9 17 4 12"/>',
  close:     '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevronDown:'<polyline points="6 9 12 15 18 9"/>',
  calendar:  '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  alert:     '<path d="M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  chart:     '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  clock:     '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  lock:      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>',
  inbox:     '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7Z"/>'
};
function icon(name, size, extraClass){
  size = size || 20;
  var body = ICONS[name] || '';
  return '<svg class="icon'+(extraClass?' '+extraClass:'')+'" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" '
    +'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
}

// ---- QORONG'I REJIM (dark mode) ----
// Sahifa <head>'idagi kichik inline skript darhol (11-band CSS yuklanishidan oldin)
// to'g'ri temani belgilaydi - shu bilan "yorqin welgashish" (flash) oldini oladi.
// Bu yerda faqat almashtirish (toggle) tugmasi va saqlash mantig'i bor.
function getTheme(){
  var saved = localStorage.getItem('parda_theme');
  if(saved==='dark'||saved==='light') return saved;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  var btn=document.getElementById('theme-toggle-btn');
  if(btn) btn.innerHTML = icon(t==='dark'?'sun':'moon', 18);
  try{ localStorage.setItem('parda_theme', t); }catch(e){}
}
function toggleTheme(){
  var cur = document.documentElement.getAttribute('data-theme')||'light';
  applyTheme(cur==='dark'?'light':'dark');
}

// ---- MAXSUS TASDIQLASH OYNASI (confirm() o'rniga) ----
// Promise qaytaradi: true (tasdiqlandi) yoki false (bekor qilindi).
// Ishlatilishi:  showConfirm("Matn", {danger:true}).then(function(ok){ if(!ok) return; ... });
function showConfirm(msg, opts){
  opts = opts || {};
  return new Promise(function(resolve){
    var ov=document.getElementById('confirm-ov');
    if(!ov){ resolve(window.confirm(msg)); return; }
    var msgEl=document.getElementById('confirm-msg');
    var iconEl=document.getElementById('confirm-icon');
    var okBtn=document.getElementById('confirm-ok-btn');
    var cancelBtn=document.getElementById('confirm-cancel-btn');
    msgEl.textContent = msg;
    iconEl.innerHTML = icon(opts.danger?'trash':'alert', 26);
    iconEl.className = 'confirm-icon'+(opts.danger?' confirm-icon-danger':'');
    okBtn.textContent = opts.okText || 'Tasdiqlash';
    cancelBtn.textContent = opts.cancelText || 'Bekor qilish';
    okBtn.className = 'confirm-btn confirm-ok'+(opts.danger?' confirm-danger':'');
    ov.classList.add('open');
    function cleanup(result){
      ov.classList.remove('open');
      okBtn.onclick=null;cancelBtn.onclick=null;ov.onclick=null;
      resolve(result);
    }
    okBtn.onclick=function(){cleanup(true);};
    cancelBtn.onclick=function(){cleanup(false);};
    ov.onclick=function(e){ if(e.target===ov) cleanup(false); };
  });
}

// ---- "BEKOR QILISH" TUGMALI BILDIRISHNOMA (undo-snack) ----
// O'chirish amali darhol bajariladi, lekin foydalanuvchi bir necha soniya
// ichida "BEKOR QILISH"ni bosib, o'zgarishni qaytarishi mumkin.
function showUndoSnack(msg, onUndo, delay){
  delay = delay || 4500;
  var s=document.getElementById('snack');
  if(!s)return;
  clearTimeout(showSnack._t);
  s.innerHTML = esc(msg)+' <button type="button" class="snack-undo-btn">BEKOR QILISH</button>';
  s.classList.add('show');
  var btn=s.querySelector('.snack-undo-btn');
  var done=false;
  function finish(){
    if(done)return; done=true;
    s.classList.remove('show');
    s.innerHTML='';
  }
  if(btn){
    btn.onclick=function(){
      finish();
      if(onUndo) onUndo();
    };
  }
  clearTimeout(showUndoSnack._t);
  showUndoSnack._t = setTimeout(finish, delay);
}

// ---- YUKLANISH OVERLAY (JPG tayyorlanayotganda) ----
function showLoading(msg){
  var o=document.getElementById('loading-ov');
  if(!o)return;
  var t=document.getElementById('loading-text');
  if(t) t.textContent = msg || 'Tayyorlanmoqda...';
  o.classList.add('open');
}
function hideLoading(){
  var o=document.getElementById('loading-ov');
  if(o) o.classList.remove('open');
}

// ---- MARKAZIY TEZKOR AMALLAR (FAB) ----
function openQuickActions(){
  var m=document.getElementById('quick-actions');
  var ov=document.getElementById('quick-actions-ov');
  if(m)m.classList.add('open');
  if(ov)ov.classList.add('open');
}
function closeQuickActions(){
  var m=document.getElementById('quick-actions');
  var ov=document.getElementById('quick-actions-ov');
  if(m)m.classList.remove('open');
  if(ov)ov.classList.remove('open');
}
function qaNewClient(){
  closeQuickActions();
  newClient();
}
function qaAddRoom(){
  closeQuickActions();
  switchPage('mahsulotlar');
  addRoom();
  setTimeout(function(){
    var el=document.getElementById('room-list');
    if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
  }, 200);
}
function qaAddPhoto(){
  closeQuickActions();
  switchPage('mahsulotlar');
  setTimeout(function(){
    var el=document.getElementById('andoza-file');
    if(el) el.click();
  }, 200);
}

document.addEventListener('parda:ready', function(){
  applyTheme(getTheme());
});
