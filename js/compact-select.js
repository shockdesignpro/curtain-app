// Keep the existing select/change model, with a small anchored picker on mobile.
(function(){
  var active=null, serial=0;
  function close(restore){
    if(!active)return;
    var old=active;active=null;old.menu.remove();old.button.setAttribute('aria-expanded','false');
    if(restore&&old.button.isConnected)old.button.focus();
  }
  function open(select,button){
    if(active&&active.button===button){close(true);return;}
    close(false);
    var menu=document.createElement('div');menu.className='compact-select-menu';menu.id='compact-options-'+(++serial);
    menu.setAttribute('role','listbox');menu.setAttribute('aria-label',button.getAttribute('aria-label'));
    button.setAttribute('aria-controls',menu.id);button.setAttribute('aria-expanded','true');
    Array.from(select.options).forEach(function(option){
      var item=document.createElement('button');item.type='button';item.setAttribute('role','option');
      item.setAttribute('aria-selected',String(option.selected));item.disabled=option.disabled;
      item.textContent=option.textContent;item.tabIndex=option.selected?0:-1;
      item.addEventListener('click',function(){
        select.value=option.value;button.textContent=option.textContent;close(true);
        select.dispatchEvent(new Event('change',{bubbles:true}));
      });menu.appendChild(item);
    });
    document.body.appendChild(menu);active={menu:menu,button:button};
    var rect=button.getBoundingClientRect(),height=window.innerHeight,width=Math.min(Math.max(rect.width,180),window.innerWidth-16);
    menu.style.width=width+'px';menu.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-width-8))+'px';
    var below=height-rect.bottom-12,above=rect.top-12;
    if(below>=160||below>=above){menu.style.top=(rect.bottom+4)+'px';menu.style.maxHeight=Math.max(70,Math.min(210,below))+'px';}
    else{menu.style.bottom=(height-rect.top+4)+'px';menu.style.maxHeight=Math.max(70,Math.min(210,above))+'px';}
    var chosen=menu.querySelector('[aria-selected="true"]')||menu.querySelector('button:not(:disabled)');
    if(chosen){menu.scrollTop=Math.max(0,chosen.offsetTop-menu.clientHeight/2);chosen.focus({preventScroll:true});}
    menu.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();close(true);return;}
      if(e.key==='Tab'){close(false);return;}
      if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
      e.preventDefault();var items=Array.from(menu.querySelectorAll('button:not(:disabled)')),i=items.indexOf(document.activeElement);
      i=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
      if(items[i])items[i].focus();
    });
  }
  function enhance(){
    if(active&&!active.button.isConnected)close(false);
    document.querySelectorAll('#room-list select,select[id^="product-"],#report-period,#cost-room-select,.order-filters select').forEach(function(select){
      if(select.dataset.compact){
        var existing=select.nextElementSibling,selected=select.options[select.selectedIndex];
        if(existing&&selected&&existing.textContent!==selected.textContent)existing.textContent=selected.textContent;
        return;
      }select.dataset.compact='true';
      var button=document.createElement('button');button.type='button';button.className='compact-select-trigger fi';
      var labelNode=select.labels&&select.labels[0];
      var label=select.getAttribute('aria-label')||(labelNode?(labelNode.querySelector('span')||labelNode).textContent.trim():'Tanlash');
      button.setAttribute('aria-label',label);button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
      button.textContent=select.options[select.selectedIndex]?select.options[select.selectedIndex].textContent:'Tanlash';
      select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
      select.after(button);button.addEventListener('click',function(){open(select,button);});
      select.addEventListener('change',function(){button.textContent=select.options[select.selectedIndex].textContent;});
      // Redirect label clicks away from the hidden native control.
      if(select.id){button.id=select.id+'-picker';Array.from(select.labels||[]).forEach(function(l){l.htmlFor=button.id;});}
    });
  }
  document.addEventListener('pointerdown',function(e){if(active&&!active.menu.contains(e.target)&&!active.button.contains(e.target))close(false);},true);
  document.addEventListener('scroll',function(e){if(active&&!active.menu.contains(e.target))close(false);},true);
  window.addEventListener('resize',function(){close(false);});
  var back=window.mobileBack;window.mobileBack=function(){if(active){close(true);return true;}return back.apply(this,arguments);};
  new MutationObserver(enhance).observe(document.getElementById('mobile-shell'),{childList:true,subtree:true});
  enhance();
})();
