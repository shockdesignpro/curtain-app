// ============================================================
// SETTINGS.JS — Sozlamalar sahifasi: bo'limlar menyusi.
//   1) Bildirishnomalar   2) Parolni o'zgartirish
//   3) Umumiy sozlamalar  4) Makroslar
// Har bir bo'lim alohida ochiladi; "Orqaga" tugmasi menyuga qaytaradi.
// ============================================================

var settingsSection=null;
var SETTINGS_TITLES={
  notifications:'Bildirishnomalar',
  password:'Parolni o‘zgartirish',
  general:'Umumiy sozlamalar',
  macros:'Makroslar'
};

function showSettingsView(name){
  settingsSection=SETTINGS_TITLES[name]?name:null;
  var menu=document.getElementById('settings-menu'),intro=document.getElementById('settings-intro');
  if(menu)menu.hidden=!!settingsSection;
  if(intro)intro.hidden=!!settingsSection;
  document.querySelectorAll('#page-settings .settings-section').forEach(function(s){
    s.hidden=s.id!=='settings-'+settingsSection;
  });
  if(mobilePage==='settings'){
    document.getElementById('header-title').textContent=settingsSection?SETTINGS_TITLES[settingsSection]:'Sozlamalar';
  }
}
function openSettingsSection(name){
  showSettingsView(name);
  if(name==='notifications'&&window.renderReminderSettings)renderReminderSettings();
  if(name==='general')renderSettingsTheme();
  if(name==='macros')renderMacroSettings();
  window.scrollTo({top:0,behavior:'instant'});
}
function closeSettingsSection(){
  showSettingsView(null);
  window.scrollTo({top:0,behavior:'instant'});
}
function renderSettingsTheme(){
  var btn=document.getElementById('settings-theme-btn');
  if(!btn)return;
  var dark=(document.documentElement.getAttribute('data-theme')||'light')==='dark';
  btn.innerHTML=icon(dark?'sun':'moon',18)+' '+(dark?'Yorug‘ rejimga o‘tish':'Tungi rejimni yoqish');
}

// Sozlamalar sahifasiga har kirilganda bo'limlar menyusidan boshlanadi.
(function(){
  var base=switchPage;
  switchPage=function(name){
    if(name==='settings'||mobilePage==='settings')showSettingsView(null);
    return base.apply(this,arguments);
  };
})();
showSettingsView(null);
