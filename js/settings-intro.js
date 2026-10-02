function reminderPreferences(){
  try{return JSON.parse(localStorage.getItem('parda_settings')||'{}')||{};}catch(e){return {};}
}
function renderReminderSettings(){
  var prefs=reminderPreferences();document.getElementById('reminder-time').value=prefs.reminderTime||'10:00';
  document.getElementById('reminder-sound-name').textContent=prefs.soundName||'Standart ovoz';
}
async function saveReminderSettings(){
  var value=document.getElementById('reminder-time').value;
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)){showSnack('Eslatma vaqtini belgilang');return;}
  var prefs=reminderPreferences();prefs.reminderTime=value;
  if(!safeSetLS('parda_settings',prefs))return;
  if(window.NativeBridge&&NativeBridge.isNative){await NativeBridge.flush();await NativeBridge.enableReminders();}
  showSnack('Eslatma vaqti saqlandi: '+value);
}
async function chooseReminderSound(){
  if(!window.NativeBridge||!NativeBridge.isNative){showSnack('Musiqa tanlash mobil ilovada ishlaydi');return;}
  try{await NativeBridge.chooseReminderSound();renderReminderSettings();}catch(e){showSnack('Ovoz tanlash oynasini ochib bo‘lmadi');}
}
async function openReminderSystemSettings(){
  if(!window.NativeBridge||!NativeBridge.isNative){showSnack('Bu sozlama mobil ilovada ishlaydi');return;}
  try{await NativeBridge.openReminderSettings();}catch(e){showSnack('Telefon sozlamalarini ochib bo‘lmadi');}
}
