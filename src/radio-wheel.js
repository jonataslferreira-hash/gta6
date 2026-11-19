const TURN = Math.PI * 2;
export const WHEEL_RATE=.32;
export const WHEEL_AUDIO_RATE=.56;
export function stationAt(dx,dy,count){
  if(Math.hypot(dx,dy)<30)return null;
  return ((Math.round((Math.atan2(dx,-dy)/TURN)*count)%count)+count)%count;
}
export function makeRadioWheel(host,{radio,icon,bind,canOpen,onOpen,onClose}){
  const panel=document.createElement('section');panel.className='radio-wheel';panel.hidden=true;
  panel.setAttribute('aria-label','Roda de estações');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.innerHTML=`<div class="wheel-stage"><header class="wheel-top"><b>VICE CITY</b><span>·</span> SINTONIA DA CIDADE</header><div class="wheel-dial" role="group" aria-label="Estações"><svg class="wheel-rings" viewBox="0 0 340 340" aria-hidden="true"><circle cx="170" cy="170" r="161"/><circle cx="170" cy="170" r="128"/><circle cx="170" cy="170" r="89"/></svg><div class="wheel-hub">${icon('radio')}<strong></strong><small></small><span></span></div></div><footer class="wheel-footer"><button class="secondary" data-wheel-cancel>Voltar <kbd>ESC</kbd></button><button class="primary" data-wheel-apply>Sintonizar <kbd>ENTER</kbd></button></footer><p class="wheel-help">Aponte ou role para escolher uma estação</p></div>`;
  host.append(panel);
  const dial=panel.querySelector('.wheel-dial'), hub=dial.querySelector('.wheel-hub');
  const stations=radio.stations; const count=stations.length;
  const symbols=['01','02','03','04','–'];
  const options=stations.map(({name},i)=>{
    const theta=i/count*TURN;const button=document.createElement('button');button.type='button';button.className='wheel-option';button.dataset.station=i;button.setAttribute('aria-label',name);button.style.setProperty('--left',`${50+Math.sin(theta)*40}%`);button.style.setProperty('--top',`${50-Math.cos(theta)*40}%`);
    button.innerHTML=`<em>${symbols[i]}</em><span>${name}</span>`;dial.append(button);return button;
  });
  let selected=0,original=0,lastScroll=-Infinity;
  const isOpen=()=>!panel.hidden;
  function choose(i){
    selected=(i+count)%count;const {name,tag,tracks}=stations[selected];
    hub.querySelector('strong').textContent=name;hub.querySelector('small').textContent=tag;
    hub.querySelector('span').textContent=tracks.length?`${String(selected+1).padStart(2,'0')} / ${tracks.length} FAIXAS`:'A CIDADE É A TRILHA';
    options.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
  }
  function open(){
    if(isOpen()||!canOpen())return false;
    original=radio.info().channel;choose(original);lastScroll=performance.now();panel.hidden=false;host.classList.add('wheel-open');radio.slow(WHEEL_AUDIO_RATE);onOpen();panel.querySelector('[data-wheel-apply]').focus({preventScroll:true});return true;
  }
  function close(apply=false){
    if(!isOpen())return;panel.hidden=true;host.classList.remove('wheel-open');radio.slow(1);
    const station=apply&&selected!==original?radio.choose(selected):null;
    onClose(station);
  }
  function scroll(e){
    if(!e.deltaY)return;if(!isOpen()&&!canOpen())return;e.preventDefault();
    if(open())return;const now=performance.now();if(now-lastScroll<105)return;lastScroll=now;choose(selected+Math.sign(e.deltaY));
  }
  function key(e){
    if(!isOpen())return false;
    if(['Escape','KeyQ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
    if(e.code==='Escape'||e.code==='KeyQ'){if(!e.repeat)close(false);}
    else if(['ArrowLeft','ArrowUp'].includes(e.code))choose(selected-1);
    else if(['ArrowRight','ArrowDown'].includes(e.code))choose(selected+1);
    else if(e.code==='Enter'&&!e.target.closest('[data-wheel-cancel]')){e.preventDefault();close(true);}
    else if(e.code==='Tab'){const controls=[...panel.querySelectorAll('button')],i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus();}
    return true;
  }
  for(const button of options){bind(button,'pointerenter',()=>choose(+button.dataset.station));bind(button,'focus',()=>choose(+button.dataset.station));bind(button,'click',()=>{choose(+button.dataset.station);close(true);});}
  bind(panel,'pointermove',e=>{if(e.pointerType==='touch'||e.target.closest('button'))return;const r=dial.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;if(Math.hypot(dx,dy)>r.width*.59)return;const i=stationAt(dx,dy,count);if(i!==null)choose(i);});
  bind(panel.querySelector('[data-wheel-cancel]'),'click',()=>close(false));bind(panel.querySelector('[data-wheel-apply]'),'click',()=>close(true));
  bind(panel,'click',e=>{if(e.target===panel)close(false);});
  return {open,close,key,scroll,isOpen};
}
