import * as T from 'three';
import { createWorld, XS, ZS, districts, activities, race, delivery, random } from './world.js';
import { person, coupe } from './actors.js';
import { radio, sfx, speech } from './sound.js';
const intro=[['Luzia','A cidade ainda cheira a gasolina quando chove.'],['Davi','Luz? Se você ainda estiver na orla, passa no quiosque. Guardei o carro.'],['Luzia','Você guardou o carro ou guardou o problema?'],['Davi','Traz as duas chaves. A menor abre o porta-luvas.']];
const acts=[
 {name:'01 / As duas chaves',goal:'Encontre Davi no quiosque da orla.',target:{x:214,z:30}, lines:[['Davi','O banco da frente continua torto. Não fui eu.'],['Luzia','E o envelope no porta-luvas? Foi você?'],['Davi','A Nara deixou. Pega o carro e passa no Sereia. Ela vai saber se você abriu.']]},
 {name:'02 / Mesa do fundo',goal:'Dirija até o Café Sereia, em Miramar.',target:{x:-51,z:84},lines:[['Luzia','A mesa do fundo ainda balança.'],['Nara','Uma moeda no pé resolve. O resto, nem sempre.'],['Luzia','No envelope só tem uma foto do cais.'],['Nara','Olha pro reflexo. Não foi tirada de terra. O barco fica no Porto Violeta.']]},
 {name:'03 / O lado de fora',goal:'Procure o barco no Porto Violeta.',target:{x:244,z:-218},lines:[['Luzia','A tinta do nome ainda tá fresca. “Segunda Chance”.'],['Davi','Seu pai não era sutil com essas coisas.'],['Luzia','Tem três discos aqui. E uma fita com o seu nome.'],['Davi','Se ainda tocar, traz pro Lúmen. A gente escuta de porta fechada.']]},
 {name:'04 / A última faixa',goal:'Leve a fita ao Clube Lúmen, no Distrito Art Déco.',target:{x:-116,z:-102},lines:[['Davi','Esse lado da fita costumava estar em branco.'],['Luzia','Era onde ele gravava o mar. Espera.'],['Davi','Isso não é o mar. É o motor do teu carro.'],['Luzia','…Deixa tocar mais um pouco.']]}
];
const clamp=T.MathUtils.clamp;
const smooth=(a,b,k,dt)=>T.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
const turn=(a,b,k,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-k*dt));
const dist=(x,z,p)=>Math.hypot(x-p.x,z-p.z);
const MODE_LABEL=['CAMPANHA','MODO LIVRE','MODO LIVRE NOTURNO'];
export function startGame(host,{mode,config,progress,icon,onPause,onSave}){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); const scene=new T.Scene();
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=mode===2 ? .94:1.04; renderer.shadowMap.type=T.PCFSoftShadowMap;
  const cam=new T.PerspectiveCamera(63,1,.12,930);renderer.domElement.className='world-view';
  host.innerHTML=`<div class="hud"><div class="hud-top"><div class="mission"><p><i></i> <span id="mode-label">${MODE_LABEL[mode]}</span></p><strong id="mission-name"></strong><small id="objective"></small></div><div class="hud-buttons"><button id="hud-radio" aria-label="Trocar rádio">${icon('radio')}</button><button id="hud-map" aria-label="Mapa">${icon('map')}</button><button id="hud-pause" aria-label="Pausa">${icon('pause')}</button></div></div><div class="toast" hidden></div><div class="interact" hidden></div><div class="caption" hidden><div><span id="speaker"></span><p id="line"></p></div><button class="secondary" id="advance">Avançar ${icon('chevron-right')}</button></div><div class="intro-cover" hidden><small>VICE CITY / LEONIDA</small><strong>Maré Alta</strong><span>CAPÍTULO 01 — AS DUAS CHAVES</span></div><div class="hud-bottom"><button class="minimap" aria-label="Abrir mapa"><canvas width="160" height="128"></canvas><span id="minidistrict">OCEAN BEACH</span></button><div class="drive" hidden><strong id="speed">000</strong><span>KM/H</span></div></div></div><div class="touch" aria-label="Controles de toque"><div class="joystick" id="stick" aria-label="Direção"><div></div></div><div class="touch-actions"><button id="touch-act" aria-label="Interagir">${icon('hand')}</button><button id="touch-run" aria-label="Correr ou frear">${icon('arrow-up')}</button></div></div><div class="map-panel" hidden><div class="map-header"><div><small>LEONIDA / 25°46′ N</small><h2>Vice City</h2></div><button class="secondary" id="close-map">Fechar ${icon('x')}</button></div><canvas id="bigmap" width="560" height="540" role="img" aria-label="Mapa da cidade com sua localização, missões e atividades"></canvas><div class="map-legend"><span>▲ VOCÊ</span><span>◆ OBJETIVO</span><span>● ATIVIDADES</span></div></div>`;
  host.prepend(renderer.domElement);const $=s=>host.querySelector(s); const cv=renderer.domElement;
  const world=createWorld(scene,mode===2), player=person();scene.add(player.root);
  let stage=mode===0?clamp(Number(progress?.stage)||0,0,acts.length):acts.length;
  const spawn=mode===2?{x:229,z:-205}:mode===0&&stage>0?(acts[stage-1]?.target||{x:207,z:74}):{x:207.2,z:75};
  player.root.position.set(spawn.x,.12,spawn.z);
  const cars=[];const palette=['#cc4b71','#91b2bb','#c08aba','#527a92','#b99871','#be6f89','#6a9e97'];
  function addCar(x,z,rot,index,patrol=null){const c=coupe(palette[index%palette.length],index%3);c.root.position.set(x,.08,z);c.root.rotation.y=rot;scene.add(c.root);c.patrol=patrol;c.rate=0;cars.push(c);return c;}
  addCar(mode===2?208.1:stage>0&&mode===0?clamp(spawn.x-6,-330,219):200.4,mode===2?-201:stage>0&&mode===0?spawn.z+1:72,0,0);
  for(let i=0;i<16;i++){const x=XS[(i*3+1)%XS.length],z=ZS[(i*7+4)%ZS.length];addCar(x+5.65,z+15,0,i+1);}
  function loop(x,z,w,d){return [{x:x-3.1,z:z-3.1},{x:x+w-3.1,z:z-3.1},{x:x+w-3.1,z:z+d-3.1},{x:x-3.1,z:z+d-3.1}];}
  for(let i=0;i<9;i++){const p=loop(XS[i%7],ZS[(i*2+1)%8],66*(i%2+1),66); const c=addCar(p[0].x,p[0].z,-Math.PI/2,i+2,p);c.index=1;c.rate=7.4+i*.35;}
  const npc=[['#566e89','#ae715e','#493752'],['#89a29b','#df9d81','#4b4962'],['#b7769c','#94635f','#655071'],['#a57c63','#c99373','#4c4d72']];
  function npcAt(x,z,i){const [jacket,skin,pants]=npc[i%npc.length],p=person({jacket,skin,pants,type:i%2});p.root.position.set(x,.125,z);p.root.rotation.y=.4;scene.add(p.root);return p;}
  const pierTraffic=addCar(207.4,145,0,6,[{x:207.4,z:248},{x:207.4,z:-190},{x:200.7,z:-190},{x:200.7,z:248}]);pierTraffic.index=1;pierTraffic.rate=11.2;
  const davi=npcAt(215.3,30.4,0);davi.root.rotation.y=Math.PI*.75;npcAt(-50.1,85,1);npcAt(-116,-100.6,2);
  const people=[];
  for(let i=0;i<23;i++){let x=i<9?215.5:XS[(i*5+3)%8]+10.1,z=i<9?-242+i*61:ZS[(i*3+4)%9]+13+random()*28; const p=npcAt(x,z,i);people.push({p,x,z,w:7+random()*15,t:random()*20});}
  const markerMat=new T.MeshBasicMaterial({color:'#ffd393',transparent:true,opacity:.89,side:T.DoubleSide});const marker=new T.Mesh(new T.RingGeometry(1.65,1.84,30),markerMat);marker.rotation.x=-Math.PI/2;scene.add(marker);
  const pointer=new T.Mesh(new T.OctahedronGeometry(.48,0),new T.MeshBasicMaterial({color:'#ffd393'}));scene.add(pointer);
  const points=activities.map(a=>{const m=new T.Mesh(new T.RingGeometry(1.53,1.69,24),new T.MeshBasicMaterial({color:'#a7ebd6',side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(a.x,.22,a.z);scene.add(m);return m;});
  let car=null, speed=0, yaw=0, viewYaw=0, elevation=.4, freeCamera=0, elapsed=0, walk=0, step=0, credit=0, timer=0, lastCollision=-100;
  let paused=false,mapOpen=false,cut=null,activeActivity=null,toasts=0,alive=true,raf,drag=null;
  const contacts=new T.Group();scene.add(contacts);
  const shadowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(16,16,2,16,16,16);g.addColorStop(0,'rgba(33,15,51,.52)');g.addColorStop(.54,'rgba(33,15,51,.32)');g.addColorStop(1,'rgba(33,15,51,0)');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);return new T.CanvasTexture(c);})();
  const shadowGeo=new T.PlaneGeometry(),shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  function groundShadow(actor,w,d){const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.scale.set(w,d,1);contacts.add(shadow);return {actor,shadow};}
  const shadows=[groundShadow(player.root,1.2,.85),...cars.map(c=>groundShadow(c.root,3.6,5.65)),...people.map(n=>groundShadow(n.p.root,1.15,.86))];
  let quality=config.quality;const keys=new Set();const touch={x:0,y:0,run:false};
  const events=[];function bind(el,name,fn,opts){el.addEventListener(name,fn,opts);events.push(()=>el.removeEventListener(name,fn,opts));}
  let target=null,context=null;
  function refresh(){
    const a=mode===0?acts[stage]:null;
    $('#mission-name').textContent=activeActivity?.name||a?.name||(mode===0?'Fim do capítulo':'Explore Vice City');
    $('#objective').textContent=activeActivity?(activeActivity.type==='race'?`Passe pelos pontos na ordem · ${activeActivity.i+1}/${race.length}`:`Leve os pedidos aos pontos marcados · ${activeActivity.i+1}/${delivery.length}`):a?.goal||(mode===0?'Continue explorando a cidade.':'Descubra a cidade e encontre atividades no mapa.');
    target=activeActivity?activeActivity.route[activeActivity.i]:a?.target||null;marker.visible=pointer.visible=Boolean(target);
    if(target){marker.position.set(target.x,.24,target.z);pointer.position.set(target.x,2.65,target.z);}
  }
  function toast(title,text){const el=$('.toast');el.replaceChildren(Object.assign(document.createElement('strong'),{textContent:title}),Object.assign(document.createElement('span'),{textContent:text}));el.hidden=false;toasts=elapsed+4.1;}
  function story(lines,done,introMode=false){cut={lines,done,i:0,introMode};$('.caption').hidden=false;$('.intro-cover').hidden=!introMode;host.classList.add('cinematic');dialogue();}
  function dialogue(){if(!cut)return;const [speaker,line]=cut.lines[cut.i];$('#speaker').textContent=speaker;$('#line').textContent=line;speech.say(line,speaker);$('#advance').innerHTML=`${cut.i===cut.lines.length-1?'Concluir':'Avançar'} ${icon('chevron-right')}`;}
  function advance(){if(!cut)return;if(++cut.i<cut.lines.length){dialogue();return;}const {done}=cut;cut=null;speech.stop();$('.caption').hidden=true;$('.intro-cover').hidden=true;host.classList.remove('cinematic');done?.();}
  function nearest(){
    const p=car?.root.position||player.root.position;
    if(mode===0&&acts[stage]&&dist(p.x,p.z,acts[stage].target)<(stage===1?7:4.8)&&!activeActivity)return{type:'story',text:stage===0?'Falar com Davi':stage===1?'Conversar com Nara':stage===2?'Examinar o barco':'Ouvir a fita'};
    if(car)return{type:'exit',text:Math.abs(speed)>2.8?'Pare para sair':'Sair do carro'};
    if(!activeActivity)for(const a of activities)if(dist(p.x,p.z,a)<4)return{type:'activity',text:a.name,a};
    let closest=3.75, chosen;for(const c of cars){if(c.patrol)continue;const d=dist(p.x,p.z,c.root.position);if(d<closest){closest=d;chosen=c;}}if(chosen)return{type:'car',car:chosen,text:'Entrar no carro'};return null;
  }
  function interact(){
    if(cut){advance();return;}if(paused||mapOpen)return;const c=nearest();if(!c)return;
    if(c.type==='story'){
      if(car&&Math.abs(speed)>2.8)return; speed=0;
      story(acts[stage].lines,()=>{stage++;onSave({stage,introSeen:true});refresh();sfx('complete');toast(stage===acts.length?'Capítulo concluído':'Missão concluída',stage===acts.length?'O som da fita continua na sua cabeça.':acts[stage].name);});
    }else if(c.type==='car'){car=c.car;speed=0;yaw=car.root.rotation.y;viewYaw=yaw;freeCamera=0;player.root.visible=false;sfx('door');toast(radio.info().station,radio.info().title);}
    else if(c.type==='exit'&&Math.abs(speed)<=2.8){const p=car.root.position; const x=Math.cos(yaw)*1.7,z=-Math.sin(yaw)*1.7;player.root.position.set(p.x+(world.collides(p.x+x,p.z+z,.35)?-x:x),.12,p.z+(world.collides(p.x+x,p.z+z,.35)?-z:z));player.root.rotation.y=yaw;car=null;speed=0;sfx('door');}
    else if(c.type==='activity'){
      if(c.a.type==='lookout'){toast('Mirante da marina','Uma boa vista também é um destino.');sfx('select');return;}
      activeActivity={...c.a,i:0,route:c.a.type==='race'?race:delivery};timer=c.a.type==='race'?62:160;refresh();toast(c.a.name,c.a.type==='race'?'Entre em um carro e siga os pontos.':'Você pode fazer a rota a pé ou de carro.');sfx('select');
    }
  }
  function drawings(can,big){
    const ctx=can.getContext('2d'),w=can.width,h=can.height,p=car?.root.position||player.root.position;
    ctx.fillStyle='#25203e';ctx.fillRect(0,0,w,h);const sc=big?Math.min(w/650,h/651):1.05;const fx=x=>w/2+(x-(big?-45:p.x))*sc,fz=z=>h/2+(z-(big?-1:p.z))*sc;
    const rect=(x,z,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(fx(x),fz(z),ww*sc,hh*sc);};
    rect(253,-320,250,642,'#34456a');rect(213,-314,40,625,'#735368');rect(-333,-314,546,625,'#332641');
    for(const b of world.blocks){if(!big&&(Math.abs(b.x-p.x)>92||Math.abs(b.z-p.z)>80))continue;rect(b.x-b.w/2,b.z-b.d/2,b.w,b.d,'#4c3d61');}
    for(const x of XS)rect(x-6,-302,12,612,'#786884');for(const z of ZS)rect(-330,z-6,543,12,'#786884');
    if(big){ctx.font='600 11px Inter';ctx.textAlign='center';for(const d of districts){ctx.strokeStyle='#2a203c';ctx.lineWidth=3;ctx.strokeText(d.name,fx(d.x),fz(d.z));ctx.fillStyle='#e6d3e4';ctx.fillText(d.name,fx(d.x),fz(d.z));}}
    for(const a of activities){ctx.fillStyle='#a7ebd6';ctx.beginPath();ctx.arc(fx(a.x),fz(a.z),big?4:3,0,Math.PI*2);ctx.fill();}
    if(target){const x=clamp(fx(target.x),8,w-8),z=clamp(fz(target.z),8,h-8);ctx.fillStyle='#ffd18f';ctx.save();ctx.translate(x,z);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();}
    ctx.save();ctx.translate(fx(p.x),fz(p.z));ctx.rotate(-(car?yaw:player.root.rotation.y));ctx.fillStyle='#fff0ee';ctx.strokeStyle='#472644';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,3);ctx.lineTo(-5,5);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
  }
  function map(open){if(paused)return;mapOpen=open;keys.clear();touch.x=touch.y=0;touch.run=false;$('.map-panel').hidden=!mapOpen;host.classList.toggle('map-open',mapOpen);if(open){drawings($('#bigmap'),true);$('#close-map').focus();}else cv.focus();}
  function nextRadio(){const track=radio.change();toast(track.station,track.title);}
  bind($('#hud-pause'),'click',()=>{if(mapOpen)map(false);onPause();});bind($('#hud-radio'),'click',nextRadio);bind($('#hud-map'),'click',()=>map(!mapOpen));bind($('.minimap'),'click',()=>map(!mapOpen));bind($('#close-map'),'click',()=>map(false));bind($('#advance'),'click',advance);bind($('.interact'),'click',interact);
  bind(window,'keydown',e=>{
    if(paused)return;
    if(['ArrowUp','ArrowRight','ArrowLeft','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyE','KeyM','KeyR','Escape'].includes(e.code))e.preventDefault();
    if(!e.repeat){if(e.code==='Escape'){if(mapOpen)map(false);else onPause();return;}if(e.code==='KeyM'){map(!mapOpen);return;}if(e.code==='KeyR'){nextRadio();return;}if(e.code==='KeyE'){interact();return;}}
    keys.add(e.code);
  });bind(window,'keyup',e=>keys.delete(e.code));bind(window,'blur',()=>{keys.clear();touch.x=touch.y=0;touch.run=false;});
  const stick=$('#stick'), knob=stick.firstElementChild;
  const setStick=e=>{const r=stick.getBoundingClientRect();const dx=(e.clientX-r.left-r.width/2),dy=(e.clientY-r.top-r.height/2),lim=r.width*.33,m=Math.max(1,Math.hypot(dx,dy)/lim);touch.x=dx/m/lim;touch.y=dy/m/lim;knob.style.transform=`translate(${dx/m}px,${dy/m}px)`;};
  bind(stick,'pointerdown',e=>{stick.setPointerCapture(e.pointerId);setStick(e);});bind(stick,'pointermove',e=>{if(stick.hasPointerCapture(e.pointerId))setStick(e);});
  const resetStick=()=>{touch.x=touch.y=0;knob.style.transform='';};bind(stick,'lostpointercapture',resetStick);
  bind($('#touch-act'),'click',interact);const run=$('#touch-run');bind(run,'pointerdown',e=>{run.setPointerCapture(e.pointerId);touch.run=true;});bind(run,'lostpointercapture',()=>{touch.run=false;});
  cv.tabIndex=-1;
  bind(cv,'pointerdown',e=>{if(paused||mapOpen||cut)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture(e.pointerId);});bind(cv,'pointermove',e=>{if(drag?.id!==e.pointerId)return;viewYaw-=(e.clientX-drag.x)*.009;elevation=clamp(elevation+(e.clientY-drag.y)*.006,.13,1.15);drag.x=e.clientX;drag.y=e.clientY;freeCamera=4;});bind(cv,'lostpointercapture',e=>{if(drag?.id===e.pointerId)drag=null;});
  function resize(){const w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;cam.aspect=w/h;cam.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.65:1));renderer.setSize(w,h);}
  function settings(c){quality=c.quality;renderer.shadowMap.enabled=quality==='high';for(const sh of shadows){sh.actor.traverse(o=>{if(o.isMesh)o.material.needsUpdate=true;});}resize();}
  bind(window,'resize',resize);settings(config);
  function move(p,dx,dz,r){let crash=false;if(!world.collides(p.x+dx,p.z,r))p.x+=dx;else crash=true;if(!world.collides(p.x,p.z+dz,r))p.z+=dz;else crash=true;return crash;}
  function axis(plus,minus,t){ return clamp((plus.some(k=>keys.has(k))?1:0)-(minus.some(k=>keys.has(k))?1:0)+t,-1,1); }
  const look=new T.Vector3();const desired=new T.Vector3();const prevLight=new T.Vector3(-1000,0,0);let last=performance.now(),mapTick=0;
  function camera(dt,snap=false){
    const p=(car?.root||player.root).position;const cinematic=Boolean(cut?.introMode), heading=cinematic?-.40+Math.sin(elapsed*.25)*.25:viewYaw;
    let range=car?8.2:4.65;let height=(car?2.65:1.85)+elevation*2.6;
    if(cinematic){range=10.5;height=4.15;}
    let x=p.x+Math.sin(heading)*range,z=p.z+Math.cos(heading)*range;
    for(let i=0;i<12&&world.collides(x,z,.40)&&!cinematic;i++){range*=.79;x=p.x+Math.sin(heading)*range;z=p.z+Math.cos(heading)*range;}
    desired.set(x,p.y+height,z);
    if(snap)cam.position.copy(desired);else cam.position.lerp(desired,1-Math.exp(-(cinematic?3:9)*dt));
    look.set(p.x-Math.sin(heading)*(car?2.35:1.3),p.y+(car?1.18:1.25),p.z-Math.cos(heading)*(car?2.35:1.3));
    if(cinematic){look.x+=2.4;look.y+=1.0;look.z-=2.7;}cam.lookAt(look);world.sky.position.copy(cam.position);
    if(prevLight.distanceTo(p)>7){prevLight.copy(p);world.sun.position.set(p.x+61,91,p.z-51);world.sun.target.position.set(p.x,0,p.z);}
  }
  function frame(now){
    if(!alive)return;raf=requestAnimationFrame(frame);const dt=clamp((now-last)/1000,.001,.10);last=now;if(paused||mapOpen)return; elapsed+=dt;
    const p=car?.root.position||player.root.position;
    if(!cut){
      const forward=axis(['KeyW','ArrowUp'],['KeyS','ArrowDown'],-touch.y), side=axis(['KeyD','ArrowRight'],['KeyA','ArrowLeft'],touch.x), running=keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.run;
      if(car){const braking=keys.has('Space')||touch.run;const targetSpeed=forward>0?forward*23:forward<0?forward*6:0;
        const same=speed*targetSpeed>=0;const accel=braking?13:forward===0?2.3:same?(forward>0?4.4:3.1):10;
        speed+=clamp((braking?0:targetSpeed)-speed,-accel*dt,accel*dt);
        const grip=clamp(Math.abs(speed)/6,0,1);yaw-=side*Math.sign(speed)*grip*(1.73-Math.min(.96,Math.abs(speed)*.038))*dt;
        const ox=p.x,oz=p.z;
        if(move(p,-Math.sin(yaw)*speed*dt,-Math.cos(yaw)*speed*dt,1.16)||cars.some(other=>other!==car&&dist(p.x,p.z,other.root.position)<2.45)){p.x=ox;p.z=oz;if(elapsed-lastCollision>.4&&Math.abs(speed)>2){sfx('bump');lastCollision=elapsed;}speed*=-.13;}
        car.root.rotation.y=yaw;car.update(dt,speed,-side);if(freeCamera<=0)viewYaw=turn(viewYaw,yaw,4.9,dt);radio.motor(Math.abs(speed),true);
      }else{
        const mag=Math.min(1,Math.hypot(forward,side)), max=running?5.9:2.95;
        walk=smooth(walk,mag*max,mag?8:16,dt);
        if(mag>.025){const heading=viewYaw+Math.atan2(-side,forward);player.root.rotation.y=turn(player.root.rotation.y,heading,13,dt);move(p,-Math.sin(heading)*walk*dt,-Math.cos(heading)*walk*dt,.31);}
        player.animate(dt,clamp(walk/2.7,0,1),running?clamp((walk-2)/3,0,1):0);
        if(walk>1.1){step+=walk*dt;if(step>(running?1.62:1.19)){step=0;sfx('step');}}else step=0;radio.motor(0,false);
      }
      if(activeActivity){timer-=dt;const a=activeActivity;if(timer<=0){activeActivity=null;refresh();toast('Tempo esgotado','Retorne ao ponto verde para tentar outra vez.');}else if((a.type!=='race'||car)&&target&&dist(p.x,p.z,target)<6){if(++a.i>=a.route.length){credit+=a.type==='race'?250:130;activeActivity=null;refresh();sfx('complete');toast('Atividade concluída',`Recompensa acumulada: $${credit}`);}else{refresh();sfx('select');}}}
    }else{player.animate(dt,0);radio.motor(0,false);}
    freeCamera=Math.max(0,freeCamera-dt);
    for(const c of cars){if(!c.patrol)continue;const v=c.patrol[c.index],p=c.root.position;const d=dist(p.x,p.z,v);if(d<1.5)c.index=(c.index+1)%c.patrol.length;const a=c.patrol[c.index];const heading=Math.atan2(p.x-a.x,p.z-a.z);c.root.rotation.y=turn(c.root.rotation.y,heading,6,dt);const slow=dist(p.x,p.z,(car?.root||player.root).position)<(car?5:3.4);const sp=slow?0:c.rate;p.x-=Math.sin(c.root.rotation.y)*sp*dt;p.z-=Math.cos(c.root.rotation.y)*sp*dt;c.update(dt,sp,0);}
    const focal=(car?.root||player.root).position;
    for(const c of cars)c.root.visible=dist(c.root.position.x,c.root.position.z,focal)<185;
    for(const n of people){n.t+=dt*.52;const p=n.p.root.position;p.z=n.z+Math.sin(n.t)*n.w;n.p.root.visible=dist(p.x,p.z,focal)<106;if(!n.p.root.visible)continue;n.p.root.rotation.y=turn(n.p.root.rotation.y,Math.cos(n.t)>=0?Math.PI:0,7,dt);n.p.animate(dt,.71,.0);}
    for(const {actor,shadow} of shadows){shadow.visible=actor.visible;if(!shadow.visible)continue;const p=actor.position;shadow.position.set(p.x, p.x>212?.131:.047,p.z);shadow.rotation.z=actor.rotation.y;}
    points.forEach((m,i)=>{m.visible=!cut&&(!activeActivity||activities[i].type!==activeActivity.type);});
    if(target){pointer.position.y=2.45+Math.sin(elapsed*2.5)*.34;pointer.rotation.y+=dt*.85;marker.scale.setScalar(1+Math.sin(elapsed*2.5)*.08);}
    if(elapsed>toasts)$('.toast').hidden=true;
    if(elapsed>mapTick){mapTick=elapsed+.105;context=cut?null:nearest();const it=$('.interact');if(context&&(!car||Math.abs(speed)<5)){it.hidden=false;const label=context.text;if(it.dataset.label!==label){it.dataset.label=label;it.innerHTML=`<kbd>E</kbd><span>${label}</span>`;}}else it.hidden=true;
      $('.drive').hidden=!car;$('#speed').textContent=String(Math.round(Math.abs(speed)*3.6)).padStart(3,'0');
      const area=districts.reduce((a,b)=>dist(p.x,p.z,a)<dist(p.x,p.z,b)?a:b);$('#minidistrict').textContent=area.name.toUpperCase();
      $('#mode-label').textContent=activeActivity?`TEMPO · ${Math.ceil(timer)} s`:MODE_LABEL[mode];drawings($('.minimap canvas'),false);
    }
    world.tide(elapsed);camera(dt);renderer.render(scene,cam);
  }
  refresh(); radio.start(mode===2?4:0);
  if(mode===0&&stage===0&&!progress?.introSeen)story(intro,()=>{onSave({stage:0,introSeen:true});toast('As duas chaves','Siga o marcador dourado até Davi.');},true);
  camera(.02,true);renderer.render(scene,cam);raf=requestAnimationFrame(frame);
  return {settings,pause(v){paused=v;keys.clear();touch.run=false;resetStick();radio.pause(v);if(v)speech.stop();},destroy(){alive=false;cancelAnimationFrame(raf);events.forEach(fn=>fn());speech.stop();radio.stop();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry){geometries.add(o.geometry);if(o.isInstancedMesh)o.dispose();}if(o.material){materials.add(o.material);if(o.material.map)textures.add(o.material.map);} });textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();host.replaceChildren();host.className='';}};
}
