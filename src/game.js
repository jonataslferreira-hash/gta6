import { makeFilm } from './film.js';
import { streetScenes } from './screening-scenes.js';
import { makeStreetDialogues } from './pedestrian-dialogue.js';
import * as T from 'three';
import { createWorld, XS, ZS, districts, random } from './world.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { person, riggedPerson, coupe } from './actors.js';
import { radio, sfx, speech, heistAudio, titleCue } from './sound.js';
import { campaign, getawayLines, sideJobs, canStopInBay, directionTo, angularError } from './missions.js';
import { makeRadioWheel, WHEEL_RATE } from './radio-wheel.js';
import { makeCinematics, sceneLabel, castStyles, miragemOutfit } from './cinematics.js';
import { casinoSite, dropLine } from './miragem.js';
import { makeHeist } from './heist.js';
import { casinoAlarm, casinoDrop, casinoEntry, casinoSearch } from './casino-dialogue.js';
import { hudDirection, shortDistance, speedometer } from './hud.js';
import { cityClock } from './daylight.js';
import { makeUrbanRouter, openSpan } from './urban-layout.js';
import { mapProjection, zoomMap } from './navigation.js';
import { makeJetSki, jetStep, jetskiDock } from './watercraft.js';
import { shore, swimStep, vaultTarget } from './traversal.js';
import { wantedStep, cleanWanted, starsFor } from './wanted.js';
import { daviWork } from './davi-work.js';
import { driveStep } from './driving.js';
import { advanceGetaway, getawayRoute, cleanState } from './getaway.js';
import { wardrobe, outfits, streetSpots, home } from './district-services.js';
import { carShape, boxesOverlap, circleBox, sweepVehicle } from './collision.js';
const clamp=T.MathUtils.clamp;
const smooth=(a,b,k,dt)=>T.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
const turn=(a,b,k,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-k*dt));
const dist=(x,z,p)=>Math.hypot(x-p.x,z-p.z);
const urbanRoute=makeUrbanRouter(XS,ZS);
const MODE_LABEL=['CAMPANHA','MODO LIVRE','MODO LIVRE NOTURNO'];
export async function startGame(host,{mode,config,progress,icon,onPause,onSave}){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); const scene=new T.Scene();
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=mode===2 ? .94:1.04; renderer.shadowMap.type=T.PCFShadowMap;
  const cam=new T.PerspectiveCamera(63,1,.12,930);renderer.domElement.className='world-view';
  host.innerHTML=`<div class="hud"><div class="hud-top"><div class="mission"><p><i></i> <span id="mode-label">${MODE_LABEL[mode]}</span></p><strong id="mission-name"></strong><small id="objective"></small><div class="mission-foot"><span id="mission-context"></span><span id="mission-step"></span></div></div><div class="hud-buttons"><button id="hud-wheel" title="Equipamento (segure Ctrl)" aria-label="Roda de equipamento">◎</button><small id="equipped-tool">MÃOS LIVRES</small><button id="hud-radio" aria-label="Abrir rádio">${icon('radio')}</button><button id="hud-jobs" title="Atividades opcionais (J)" aria-label="Atividades opcionais">✦</button><button id="hud-switch" title="Trocar personagem (V)" aria-label="Trocar personagem" hidden>⇄</button><button id="hud-map" aria-label="Mapa">${icon('map')}</button><button id="hud-pause" aria-label="Pausa">${icon('pause')}</button></div></div><div class="toast" hidden></div><button type="button" class="interact" hidden></button><aside class="getaway-card" id="getaway-card" aria-label="Tutorial da fuga" hidden><header><span class="getaway-tag"><i></i> PRÓLOGO / FUGA</span><button id="skip-getaway" type="button">Pular tutorial</button></header><div class="getaway-body"><div class="getaway-keys"><kbd id="getaway-key"></kbd><kbd id="getaway-touch"></kbd></div><div><strong id="getaway-title"></strong><p id="getaway-tip"></p></div></div><div class="getaway-progress" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></aside><div id="route-beacon" class="route-beacon" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 20 19 12 15 4 19Z"/></svg><span><b></b><small></small></span></div><section class="ride-caption" hidden aria-live="polite"><small></small><p></p></section><div class="casino-title" hidden><span>CASINO MIRAGEM</span><small>VICE CITY · 18 DE JUNHO DE 2028 · 19:41</small></div><aside class="casino-tip" hidden><small>PRÓLOGO / A MALA ERRADA</small><strong></strong><p></p><kbd></kbd><button id="skip-casino">Pular prólogo</button><i><b></b></i></aside><div class="miragem-logo" aria-hidden="true" hidden><div class="miragem-sun"></div><div><span>VICE CITY</span><strong>MARÉ <em>ALTA</em></strong><small>LEONIDA · COSTA ATLÂNTICA</small></div></div><div class="prologue-credits" aria-hidden="true" hidden><small>PRÓLOGO / A MALA ERRADA</small><b></b><span></span></div><button id="lock-mouse" type="button" hidden>Capturar mouse <kbd>F</kbd></button><div class="pulse-sight" aria-hidden="true"></div><div id="heat" aria-label="Nível de procura" hidden><span aria-hidden="true"></span><small></small></div><div class="switch-cover" hidden><small>VICE CITY / COSTA SUL</small><strong></strong></div><div id="lock-note" role="status" hidden></div><div class="screen-impact" aria-hidden="true"></div><div class="miragem-letterbox" aria-hidden="true"></div><div class="miragem-direction" hidden aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 12 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg><b></b></div><div class="miragem-location" hidden aria-live="polite"></div><div class="cinema-matte" aria-hidden="true"></div><div class="caption" role="region" aria-label="Diálogo da cutscene" hidden><div><span id="speaker"></span><p id="line" aria-live="polite"></p><div class="line-track" aria-hidden="true"></div></div><button class="secondary" id="advance">Avançar ${icon('chevron-right')}</button></div><div class="scene-location" hidden><small>VICE CITY / LEONIDA</small><strong id="scene-name"></strong><span id="scene-time"></span></div><div class="hud-bottom"><button class="minimap" aria-label="Abrir mapa"><canvas width="160" height="128"></canvas><span class="minimap-label"><b id="minidistrict">OCEAN BEACH</b><output id="compass" aria-label="Orientação da câmera">N</output></span><small id="nav-distance" hidden></small></button><div class="drive" hidden><div class="drive-head"><span class="drive-tag">VELOCIDADE</span><output id="gear" aria-label="Marcha">D</output></div><div><strong id="speed">000</strong><span>KM/H</span></div><div class="drive-meter" aria-hidden="true"><i></i></div><div class="drive-ticks" aria-hidden="true"><span>0</span><span>40</span><span>80</span></div></div></div></div><div class="touch" aria-label="Controles de toque"><div class="joystick" id="stick" aria-label="Direção"><div></div></div><div class="touch-actions"><button id="touch-act" aria-label="Interagir">${icon('hand')}</button><button id="touch-jump" aria-label="Pular ou abrir paraquedas">↥</button><button id="touch-tool" aria-label="Usar equipamento" hidden>◎</button><button id="touch-run" aria-label="Correr ou frear">${icon('arrow-up')}</button></div></div><div class="map-panel" hidden><div class="map-header"><div><small>LEONIDA / 25°46′ N</small><h2>Vice City</h2></div><button class="secondary" id="close-map">Fechar ${icon('x')}</button></div><div class="map-controls"><span id="waypoint-info">Clique no mapa para marcar um destino</span><div class="map-zoom"><button type="button" id="zoom-out" aria-label="Diminuir zoom">−</button><output id="map-scale">100%</output><button type="button" id="zoom-in" aria-label="Aumentar zoom">+</button></div><button class="secondary" id="clear-waypoint" hidden>Limpar destino</button></div><canvas id="bigmap" width="720" height="570" tabindex="0" role="img" aria-label="Mapa da cidade com sua localização, missões e atividades"></canvas><div class="map-legend"><span>▲ VOCÊ</span><span>◆ OBJETIVO</span><span>● ATIVIDADES</span><span class="gps-legend">◆ SEU DESTINO</span></div></div><section class="city-panel" id="jobs-panel" aria-label="Atividades opcionais" hidden><header><div><small>VICE CITY / GUIA DA CIDADE</small><h2>Fora da história</h2></div><button class="secondary" id="close-jobs">Fechar</button></header><p class="city-status" id="city-status"></p><button class="secondary" id="after-hours" type="button">Marcar Café Sereia · Depois do expediente</button><div class="jobs-list" id="jobs-list"></div><button class="secondary" id="cancel-job" hidden>Abandonar atividade</button></section><section class="city-panel" id="radio-panel" hidden aria-label="Rádio da cidade"><header><div><small>FREQUÊNCIAS / VICE CITY</small><h2>Rádio</h2></div><button class="secondary" id="close-radio">Fechar</button></header><p class="city-status" id="now-playing"></p><div class="jobs-list" id="stations"></div><button class="secondary" id="skip-radio">Próxima faixa</button></section><section class="city-panel wardrobe-panel" id="wardrobe-panel" aria-label="Vestiário Neon" role="dialog" aria-modal="true" hidden><header><div><small>OCEAN BEACH / ESTILO</small><h2>Vestiário Neon</h2></div><button class="secondary" id="close-wardrobe">Sair</button></header><p>Escolha uma combinação. A roupa fica salva e aparece na cidade.</p><div class="wardrobe-list" id="wardrobe-list"></div></section><section class="city-panel puzzle-panel" id="puzzle-panel" aria-label="Painel de desafio" hidden><header><div><small>VICE CITY / DESAFIO</small><h2 id="puzzle-title"></h2></div><button class="secondary" id="close-puzzle">Sair</button></header><p id="puzzle-clue"></p><div class="puzzle-keys" id="puzzle-keys"></div><p role="status" id="puzzle-feedback"></p><button class="secondary" id="replay-puzzle">Repetir sequência</button></section>`;
  host.prepend(renderer.domElement);const $=s=>host.querySelector(s); const cv=renderer.domElement;
  const loadCast=async name=>{try{return {...await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`),clone};}catch(error){console.warn(`Modelo ${name} indisponível`,error);return null;}};
  const [asset,daviAsset,miragemMap]=await Promise.all([loadCast('luzia'),loadCast('davi'),new T.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}models/miragem-luzia.webp`).catch(()=>null)]);
  if(asset&&miragemMap){miragemMap.colorSpace=T.SRGBColorSpace;miragemMap.flipY=false;miragemMap.anisotropy=4;asset.miragemMap=miragemMap;}

  const makeDavi=options=>daviAsset?riggedPerson(daviAsset,{male:true,...options}):person(castStyles.Davi);
  const world=createWorld(scene,mode===2), luzia=asset?riggedPerson(asset,{performance:true}):person();scene.add(luzia.root);
  const kioskDavi={x:215.3,z:30.4},daviPlayer=makeDavi({performance:true});daviPlayer.root.visible=false;scene.add(daviPlayer.root);
  let player=luzia,lead='Luzia';const jet=makeJetSki(scene),escapeMate=makeDavi();escapeMate.root.visible=false;scene.add(escapeMate.root);
  const ripples=[0,1,2].map(()=>{const ring=new T.Mesh(new T.RingGeometry(.91,1,36),new T.MeshBasicMaterial({color:'#d9efed',opacity:0,transparent:true,depthWrite:false,side:T.DoubleSide}));ring.visible=false;ring.rotation.x=-Math.PI/2;scene.add(ring);return ring;});
  let stage=mode===0?clamp(Number(progress?.stage)||0,0,campaign.length):campaign.length;
  let storyStep=clamp(Number(progress?.step)||0,0,(campaign[stage]?.steps.length||1)-1);
  const campaignCheckpoint=()=>campaign[stage]?.steps[storyStep-1]||campaign[stage-1]?.steps.at(-1);
  const cp=campaignCheckpoint();
  const newGetaway=mode===0&&stage===0&&storyStep===0&&!progress?.casinoSeen;
  const spawn=mode===2?{x:232,z:-205}:mode===0&&cp?cp:{x:211.3,z:74};
  const progressState={...progress,side:{...progress?.side}};
  let outfit=outfits.find(o=>o.id===progressState.outfit)||outfits[0];player.outfit?.(outfit);
  function saveProgress(){if(mode===0){progressState.stage=stage;progressState.step=storyStep;}onSave(progressState);}
  player.root.position.set(spawn.x,.12,spawn.z);
  const cars=[];const palette=['#cc4b71','#91b2bb','#c08aba','#527a92','#b99871','#be6f89','#6a9e97'];
  function addCar(x,z,rot,index,patrol=null){const c=coupe(index===0?'#e7b79f':palette[index%palette.length],index===0?3:index%3);const blocked=(x,z)=>world.collidesVehicle(x,z,rot)||cars.some(({root})=>Math.abs(root.position.x-x)<5&&Math.abs(root.position.z-z)<5&&boxesOverlap(carShape(x,z,rot),carShape(root.position.x,root.position.z,root.rotation.y)));
    if(blocked(x,z)){const place=[[0,3.1],[0,-3.1],[-2.5,0],[2.5,0],[-5,0],[0,-6],[0,6]].find(([dx,dz])=>!blocked(x+dx,z+dz));if(!place)return null;x+=place[0];z+=place[1];}
    c.root.position.set(x,.08,z);c.root.rotation.y=rot;scene.add(c.root);c.patrol=patrol;c.rate=0;cars.push(c);return c;}
  const openingCar=addCar(newGetaway?208.6:mode===2?208.1:mode===0&&campaignCheckpoint()?clamp(spawn.x-5.2,XS[0]+4,219):208.7,newGetaway?dropLine.z-5:mode===2?-201:mode===0&&campaignCheckpoint()?spawn.z+7:68.5,0,0);
  const tailCar=newGetaway?addCar(205.4,162,0,1):null;tailCar?.root.scale.setScalar(.99);
  const enforcer=coupe('#596981',2);enforcer.root.position.set(0,-30,0);scene.add(enforcer.root);enforcer.root.visible=false;let pursuitActive=false;
  const beaconTop=new T.PointLight('#5d9cff',0,6.5,1.8);beaconTop.position.set(0,1.74,0);enforcer.root.add(beaconTop);
  for(let i=0;i<16;i++){const x=XS[(i*3+1)%XS.length],z=ZS[(i*7+4)%ZS.length];addCar(x+5.65,z+15,0,i+1);}
  function loop(x,z,w,d){return [{x:x-3.1,z:z-3.1},{x:x+w-3.1,z:z-3.1},{x:x+w-3.1,z:z+d-3.1},{x:x-3.1,z:z+d-3.1}];}
  for(let i=0;i<13;i++){const ax=i%(XS.length-2),az=(i*2+1)%(ZS.length-2),lx=ax+1+i%2;
    if(!openSpan('x',ax,az)||!openSpan('x',lx,az)||Array.from({length:lx-ax},(_,j)=>ax+j).some(j=>!openSpan('z',j,az)||!openSpan('z',j,az+1)))continue;
    const p=loop(XS[ax],ZS[az],XS[lx]-XS[ax],ZS[az+1]-ZS[az]); const c=addCar(p[0].x,p[0].z,-Math.PI/2,i+2,p);if(c){c.index=1;c.rate=7.4+i*.35;}}
  const pierTraffic=addCar(201.35,newGetaway?100:145,0,6,[{x:207.4,z:248},{x:207.4,z:-190},{x:200.7,z:-190},{x:200.7,z:248}]);if(pierTraffic){pierTraffic.index=1;pierTraffic.rate=11.2;}
  function named(name,x,z,heading){const actor=person(castStyles[name]);actor.root.position.set(x,.125,z);actor.root.rotation.y=heading;scene.add(actor.root);return actor;}
  const davi=daviPlayer,homeDavi=mode===0&&stage===0&&storyStep===0?kioskDavi:{x:home.entryX-1.42,z:home.z+.35};
  davi.root.position.set(homeDavi.x,.125,homeDavi.z);davi.root.rotation.y=homeDavi===kioskDavi?Math.PI*.75:0;
  const nara=named('Nara',streetScenes.afterHours.x,streetScenes.afterHours.z,Math.PI*.66);
  let filmActors=[];
  const film=makeFilm(host,{scene,cast:{
    Luzia:()=>asset?riggedPerson(asset,{performance:true}):person(castStyles.Luzia),
    Davi:()=>makeDavi({performance:true}),Nara:()=>person(castStyles.Nara),
  },onStart(){
    clearInput();clearRideTalk();releaseMouse();radio.pause(true);
    filmActors=[...new Set([player.root,davi.root,nara.root])].map(root=>[root,root.visible]);
    for(const [root] of filmActors)root.visible=false;
  },onEnd(){
    for(const [root,visible] of filmActors)root.visible=visible;filmActors=[];
    if(alive){clearInput();radio.pause(false);cv.focus();}
  }});
  const people=[];
  for(let i=0;i<48;i++){
    let x=i<21?213.4+i%4*2.6:XS[(i*5+3)%8]+9.25,z=i<21?-259+i*27:ZS[(i*3+4)%9]+13+random()*28;
    const p=crowdActor(x,z,i+3);people.push({p,x,z,w:i%6===0?0:6+random()*14,t:random()*20});
  }
  for(const [x,z] of [[213.6,55],[219.9,60],[218.2,80],[215.4,91],[217.1,102],[221.3,54],[219.8,45],[235.1,-229]]){
    const p=crowdActor(x,z,people.length+3);people.push({p,x,z,w:Math.random()*2.6,t:random()*20});
  }
  const markerMat=new T.MeshBasicMaterial({color:'#ffd393',transparent:true,opacity:.89,side:T.DoubleSide});const marker=new T.Mesh(new T.RingGeometry(1.65,1.84,30),markerMat);marker.rotation.x=-Math.PI/2;scene.add(marker);
  const pointer=new T.Mesh(new T.OctahedronGeometry(.48,0),new T.MeshBasicMaterial({color:'#ffd393'}));scene.add(pointer);
  const environments=[
    {type:'beach',x:237,z:52,rows:14,d:24}, {type:'beach',x:240,z:-74,rows:14,d:30},
    {type:'night',x:217.6,z:2,rows:12,d:43}, {type:'night',x:-113.7,z:-95,rows:12,d:31},
    {type:'morning',x:221.0,z:115,rows:10,d:38}, {type:'morning',x:233.9,z:-207,rows:9,d:22},
  ];
  for(const {type,x,z,rows,d} of environments)for(let i=0;i<rows;i++){
    const px=x+Math.sin(i*2.714)*(type==='beach'?6.9:type==='night'?2.2:3.3),pz=z+(i/(rows-1)-.5)*d;
    if(world.collides(px,pz,.35))continue;
    const p=crowdActor(px,pz,people.length+8,type==='beach');people.push({p,x:px,z:pz,t:i*.39,w:1.6+random()*2.8,type});
  }
  function crowdActor(x,z,i,beach=false){
    const clothes=beach?['#f0bc67','#2b8794','#f08c9d','#e2d2a9','#274f71','#b74d52']:['#c25d55','#5d727e','#6c8b67','#ceaa74','#654b79','#cf9697','#d6cebb'];
    const skin=['#86543e','#bd805d','#6d423d','#d5a080','#e5b093','#a46d56'];
    const actor=person({type:i%3===0?1:0,jacket:clothes[i%clothes.length],skin:skin[i%skin.length],pants:(beach?['#366c80','#f59b81','#485d7d','#ede0cd']:['#4f514a','#4a3551','#585667','#413f4b'])[Math.floor(i/3)%4],hair:['#2d2229','#634432','#372737','#6b4a30','#28262b'][i%5],extra:{variant:i,beach,build:.80+(i%7)*.076,height:.86+(i%6)*.038}});
    actor.voice=i%3===0?'Beto':'Célia';actor.root.position.set(x,.125,z);actor.root.rotation.y=i*1.1;actor.root.visible=false;return actor;
  }
  const points=sideJobs.map(a=>{const m=new T.Mesh(new T.RingGeometry(1.53,1.69,24),new T.MeshBasicMaterial({color:'#a7ebd6',side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(a.x,.22,a.z);scene.add(m);return m;});
  let car=null, speed=0, yaw=0, viewYaw=0, elevation=.4, freeCamera=0, elapsed=0, walk=0, step=0, credit=0, timer=0, lastCollision=-100;
  let swimming=false,vault=null,devTools=config.devMode&&mode!==0,fullMotion=config.fullMotion,meetup=null;
  let heist,pickup=false,disguise=false,initialDisguise=null,waypoint=null,mapViewport=null,ctrlHeld=false,jumpVelocity=0,footHeight=0,lastStreetVoice=-60,clockSkip=0,clockSkipGoal=0;
  let streetTalker=null,navSwitch=null, daviTask=null, onJet=false,jetSpeed=0,wanted=cleanWanted(),incident=0,lastAttack=-20,discharge=0,streetCooldown=0,heatPump=0,tailGuide=0,driveAge=0,creditBeat=-1,pendingDrop=null,driving=cleanState(),getaway=-1,followBlend=0,rideLine=0,rideTimer,rideDeadline=0,rideRemaining=0,rideFinish=null,hitFx=0;
  const cameraTarget=new T.Vector3(),handoffLook=new T.Vector3();
  let paused=false,mapOpen=false,guideOpen=false,radioOpen=false,wardrobeOpen=false,puzzle=null,cut=null,activeActivity=null,tracked=null,toasts=0,alive=true,raf,drag=null;
  credit=Object.entries(progressState.side).reduce((sum,[id,count])=>sum+(count>0?(sideJobs.find(a=>a.id===id)?.reward||0):0),0);
  const courseMat=new T.MeshBasicMaterial({color:'#ffd59e',transparent:true,opacity:.83});
  const courseGate=new T.Group(), gateGeo=new T.BoxGeometry(), gatePiece=(x,y,z,w,h,d)=>{const m=new T.Mesh(gateGeo,courseMat);m.position.set(x,y,z);m.scale.set(w,h,d);courseGate.add(m);};
  gatePiece(-3.6,1.2,0,.13,2.4,.14);gatePiece(3.6,1.2,0,.13,2.4,.14);gatePiece(0,2.4,0,7.2,.12,.15);
  const vinyl=new T.Group(),record=new T.Mesh(new T.CylinderGeometry(.31,.31,.036,26),new T.MeshStandardMaterial({color:'#392444',roughness:.37}));
  vinyl.add(record);const recordLabel=new T.Mesh(new T.CylinderGeometry(.104,.104,.041,20),new T.MeshBasicMaterial({color:'#f29fbc'}));vinyl.add(recordLabel);scene.add(vinyl);
  const bay=new T.Group();for(const k of [-1,1]){const rail=new T.Mesh(gateGeo,courseMat);rail.position.set(k*1.65,.043,0);rail.scale.set(.09,.015,6.55);bay.add(rail);const end=new T.Mesh(gateGeo,courseMat);end.position.set(0,.043,k*3.25);end.scale.set(3.35,.015,.10);bay.add(end);}scene.add(bay,courseGate);

  const contacts=new T.Group();scene.add(contacts);
  const shadowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(16,16,2,16,16,16);g.addColorStop(0,'rgba(33,15,51,.52)');g.addColorStop(.54,'rgba(33,15,51,.32)');g.addColorStop(1,'rgba(33,15,51,0)');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);return new T.CanvasTexture(c);})();
  const shadowGeo=new T.PlaneGeometry(),shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  function groundShadow(actor,w,d){const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.scale.set(w,d,1);contacts.add(shadow);return {actor,shadow};}
  const shadows=[groundShadow(luzia.root,1.2,.85),groundShadow(daviPlayer.root,1.2,.85),...cars.map(c=>groundShadow(c.root,3.6,5.65)),groundShadow(enforcer.root,3.6,5.65),...people.map(n=>groundShadow(n.p.root,1.15,.86))];
  let quality=config.quality,mouseSensitivity=Number(config.mouse)||55,lockBusy=false,lockDenied=false,restoreLock=false;const keys=new Set();const touch={x:0,y:0,run:false};
  const events=[];function bind(el,name,fn,opts){el.addEventListener(name,fn,opts);events.push(()=>el.removeEventListener(name,fn,opts));}
  const cinema=makeCinematics(scene,world,{asset,makeDavi});
  const wardrobeMark=new T.Mesh(new T.RingGeometry(.82,1,28),new T.MeshBasicMaterial({color:'#ff88c9',side:T.DoubleSide}));wardrobeMark.rotation.x=-Math.PI/2;wardrobeMark.position.set(wardrobe.x,.187,wardrobe.z);scene.add(wardrobeMark);
  function releaseMouse(){if(document.pointerLockElement===cv)document.exitPointerLock?.();}
  const credits=[['DIREÇÃO DE CENA','Cecília Vale'],['DESENHO DE SOM','Rafa Moura'],['CIDADE E AMBIENTE','Inês Salgado'],['VEÍCULOS','Miguel Lessa'],['ANIMAÇÃO','Nina Costa'],['PRODUÇÃO','Maré Alta']];
  const finePointer=matchMedia('(pointer:fine)');
  const mapPrompt=matchMedia('(pointer:coarse)').matches?'Toque no mapa para marcar um destino':'Clique no mapa para marcar um destino';
  $('#waypoint-info').textContent=mapPrompt;
  function lockError(){
    lockBusy=false;lockDenied=true;const note=$('#lock-note'),link=document.createElement('a');
    link.href=location.href;link.target='_blank';link.rel='noopener';link.textContent='Abrir jogo em nova aba';
    note.replaceChildren('O navegador não liberou a captura aqui. ',link);note.hidden=false;
  }
  function requestMouse(){
    if(document.pointerLockElement===cv||lockBusy||!cameraEnabled()||!finePointer.matches)return;
    if(!cv.requestPointerLock){lockError();return;}
    lockBusy=true;lockDenied=false;cv.focus({preventScroll:true});
    try{const attempt=cv.requestPointerLock();attempt?.catch?.(lockError);}catch{lockError();}
  }
  function lockHint(){const active=cameraEnabled()&&finePointer.matches&&document.pointerLockElement!==cv;$('#lock-mouse').hidden=!active;if(!active)$('#lock-note').hidden=true;}
  bind($('#lock-mouse'),'click',requestMouse);
  const radioWheel=makeRadioWheel(host,{radio,icon,bind,canOpen:()=>!paused&&!mapOpen&&!guideOpen&&!radioOpen&&!wardrobeOpen&&!puzzle&&!cut&&!heist&&!toolWheel.isOpen(),
    onOpen(){clearInput();releaseMouse();},onClose(station){clearInput();cv.focus();if(station)toast(station.station,station.title||'Som da cidade');}});
  const tools=[{name:'Mãos livres',tag:'AÇÃO DE PERTO',hint:'CLIQUE PARA EMPURRAR',glyph:'✊',tracks:[]},{name:'Pulso neon',tag:'ATORDOADOR DE ARCADE',hint:'CLIQUE ESQUERDO PARA DISPARAR',glyph:'✦',tracks:[]},{name:'Lanterna',tag:'LUZ DE BOLSO',hint:'CLIQUE PARA ACENDER',glyph:'◉',tracks:[]},{name:'Parapente',tag:'QUEDA DO TERRAÇO',hint:'ESPAÇO PARA ABRIR',glyph:'⌁',tracks:[]}];
  let tool=0;const torch=new T.PointLight('#f8d0b1',0,8,2);scene.add(torch);
  const toolWheel=makeRadioWheel(host,{radio:{stations:tools,info:()=>({channel:tool}),slow:rate=>radio.slow(rate),choose(i){tool=i;$('#equipped-tool').textContent=tools[i].name.toUpperCase();host.classList.toggle('pulse-ready',i===1);return {station:tools[i].name};}},icon,bind,label:'Roda de equipamento',kicker:'EQUIPAMENTO',applyLabel:'Equipar',hold:true,
    canOpen:()=>!paused&&!mapOpen&&!guideOpen&&!radioOpen&&!wardrobeOpen&&!puzzle&&!cut&&!heist?.title&&!radioWheel.isOpen(),onOpen(){releaseMouse();},onClose(){cv.focus();}});
  const wheel={isOpen:()=>toolWheel.isOpen()||radioWheel.isOpen(),close:apply=>{toolWheel.close(apply);radioWheel.close(apply);},key:e=>toolWheel.key(e)||radioWheel.key(e),scroll:e=>{if(toolWheel.isOpen())toolWheel.scroll(e);else radioWheel.scroll(e);}};
  function jump(){
    if(heist){heist.jump();return;}
    if(swimming||vault||onJet||car||footHeight>.01||mapOpen||wardrobeOpen||puzzle||guideOpen||radioOpen||cut||paused||wheel.isOpen())return;
    const p=player.root.position,direction=player.root.rotation.y,onto=vaultTarget(p,direction,world.vaultRails,blockedFoot);
    if(onto){vault={x:p.x,z:p.z,t:0,duration:.78,to:onto,support:new T.Vector3(onto.support.x,onto.support.y,onto.support.z)};player.root.rotation.y=direction;player.vault?.(.78);}
    else{jumpVelocity=5.15;player.jump?.();}
    sfx('jump');
  }
  function useTool(){if(heist){heist.action(tools[tool].name,viewYaw);return;}if(car||onJet||swimming||vault||elapsed-lastAttack<.44)return;
    if(tool===2){torch.intensity=torch.intensity?0:5.6;sfx('select');return;}
    if(tool===3)return;
    lastAttack=elapsed;player.root.rotation.y=viewYaw;player.attack?.(tool===1);
    const p=player.root.position,dx=-Math.sin(viewYaw),dz=-Math.cos(viewYaw),pulse=tool===1, reach=pulse?11:1.78;
    const witnesses=people.filter(n=>n.p.root.visible&&dist(p.x,p.z,n.p.root.position)<(pulse?22:8.1)&&clearStreetLine(p,n.p.root.position));
    const victim=witnesses.map(n=>{const q=n.p.root.position,d=dist(p.x,p.z,q);return {n,q,d,dot:((q.x-p.x)*dx+(q.z-p.z)*dz)/Math.max(.05,d)};}).filter(o=>o.d<reach&&o.dot>(pulse?.88:.37)).sort((a,b)=>a.d-b.d)[0];
    if(pulse){const end=victim?.q||{x:p.x+dx*reach,z:p.z+dz*reach};lineBurst.geometry.attributes.position.setXYZ(0,p.x+Math.cos(viewYaw)*.25,p.y+1.1,p.z);lineBurst.geometry.attributes.position.setXYZ(1,end.x,p.y+1.02,end.z);lineBurst.geometry.attributes.position.needsUpdate=true;lineBurst.geometry.computeBoundingSphere();discharge=.105;sfx('pulse');}else sfx('swing');
    if(victim){victim.n.flinch=pulse?.84:.50;victim.n.avoid=6.9;incident+=pulse?1.30:.83;}
    else if(pulse&&witnesses.length)incident+=.62;
    if(pulse||victim)for(const n of witnesses)n.avoid=Math.max(n.avoid||0,3.8+random()*3);
    if(victim&&elapsed-streetCooldown>2.8){streetCooldown=elapsed;sayStreet(victim.n,'esbarrao');}}
  const lineBurst=new T.Line(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3)),new T.LineBasicMaterial({color:'#b2f4ff'}));lineBurst.visible=false;scene.add(lineBurst);
  const chooseStreetLine=makeStreetDialogues();
  function sayStreet(n,kind){
    if(!n||cut||film.active||heist||pickup||disguise||getaway>=0||daviReserved())return;
    const [speaker,text]=chooseStreetLine(kind,n.p.voice);
    const position=(car?.root||player.root).position;
    narrative(speaker,text,3650,null,voiceDistance(position.distanceTo(n.p.root.position)));streetTalker=n;lastStreetVoice=elapsed;
  }
  function voiceDistance(m){return 1/(1+(m/3.7)**2);}
  function clearStreetLine(a,b){const length=dist(a.x,a.z,b);for(let d=.85;d<length-.65;d+=.86){let f=d/length;if(world.collides(T.MathUtils.lerp(a.x,b.x,f),T.MathUtils.lerp(a.z,b.z,f),.05,true))return false;}return true;}
  const gps=new T.Mesh(new T.RingGeometry(.89,1.10,30),new T.MeshBasicMaterial({color:'#81e6ff',side:T.DoubleSide,transparent:true,opacity:.88}));gps.rotation.x=-Math.PI/2;gps.visible=false;scene.add(gps);
  function setWaypoint(point){waypoint=point;gps.visible=!!point;if(point)gps.position.set(point.x,.21,point.z);$('#clear-waypoint').hidden=!point;$('#waypoint-info').textContent=point?'Destino marcado · linha azul no mapa':mapPrompt;if(mapOpen)drawings($('#bigmap'),true);}
  function narrative(speaker,text,sub=4500,after,volume=1){clearRideTalk();const id=rideLine,caption=$('.ride-caption');caption.querySelector('small').textContent=speaker;caption.querySelector('p').textContent=text;caption.hidden=false;
    const hide=ms=>scheduleRide(ms,()=>{if(id!==rideLine)return;caption.hidden=true;after?.();});
    hide(sub);speech.say(text,speaker,{volume,onStart:d=>hide(Math.max(sub,(d||3)*1000+700)),onEnd:()=>hide(after?140:525),onUnavailable:()=>hide(sub)});
  }
  function drawWardrobe(){
    $('#wardrobe-list').innerHTML=outfits.map(o=>`<button class="outfit-card" type="button" data-outfit="${o.id}" aria-pressed="${o.id===outfit.id}"><i style="--swatch:${o.tone}" aria-hidden="true"></i><span><strong>${o.name}</strong><small>${o.detail}</small></span><b>${o.id===outfit.id?'EM USO':'VESTIR'}</b></button>`).join('');
  }
  function openWardrobe(open){
    if(!open&&!wardrobeOpen)return;wardrobeOpen=open;clearInput();releaseMouse();$('#wardrobe-panel').hidden=!open;host.classList.toggle('wardrobe-open',open);if(open){drawWardrobe();$('#close-wardrobe').focus();}else cv.focus();
  }
  let target=null,context=null;
  let storyLeg=0;
  const currentStep=()=>{
    const step=mode===0&&lead==='Luzia'?campaign[stage]?.steps[storyStep]:null;
    return step?.via?.[storyLeg]?{...step,...step.via[storyLeg]}:step;
  };
  function refresh(){
    const a=mode===0&&lead==='Luzia'?campaign[stage]:null, step=currentStep(), job=activeActivity;
    $('#mission-name').textContent=pickup?'Carro da fuga':disguise?'Despiste · troque de roupa':getaway>=0?'Saída pela orla':job?.name||a?.name||(mode===0?'Fim do capítulo':'Explore Vice City');
    $('#objective').textContent=pickup?'Entre no carro para fugir pela orla.':disguise?'Entre no Vestiário Neon e vista outra roupa.':getaway>=0?'Despiste o carro preto e encontre uma saída.':tracked&&!job?`Destino opcional: ${tracked.name}. Siga o marcador verde.`:job?(job.kind==='photo'?'Gire a câmera em direção à roda-gigante e use Interagir.':`${job.desc} · ${job.i+1}/${job.route?.length||1}`):step?.goal||(mode===0?'O capítulo acabou. As atividades continuam abertas.':'Abra o guia ✦ (J) para encontrar atividades opcionais.');
    const steps=getaway>=0?getawayRoute.length:a?.steps.length||0,index=getaway>=0?getaway:storyStep;
    $('#mission-context').textContent=pickup||getaway>=0||disguise?'PRÓLOGO':job||tracked?'ROTEIRO LIVRE':a?'HISTÓRIA':'VICE CITY / LEONIDA';
    $('#mission-step').textContent=steps&&!pickup&&!disguise&&!job&&!tracked?`${String(index+1).padStart(2,'0')} / ${String(steps).padStart(2,'0')}`:'';
    const mission=$('.mission');mission.getAnimations().forEach(a=>a.cancel());
    if(fullMotion||!matchMedia('(prefers-reduced-motion: reduce)').matches)mission.animate([{opacity:.62,transform:'translateX(-6px)'},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'ease-out'});
    target=pickup?openingCar.root.position:disguise?wardrobe:getaway>=0?getawayRoute[getaway]:lead==='Davi'?activeDaviPoint():(job?.route?.[job.i] || tracked || step || null);
    if(lead==='Davi'){$('#mission-name').textContent=daviTask?.work.name||'Davi / Linha independente';$('#objective').textContent=daviTask?activeDaviPoint()?.text||'Entrega concluída':'Encontre um serviço de Davi no cais ou na orla.';$('#mission-context').textContent='VICE CITY / DAVI';$('#mission-step').textContent=daviTask?`${daviTask.index+1} / ${daviTask.work.stops.length}`:'';}
    marker.visible=pointer.visible=Boolean(target);
    const color=job||tracked?'#75ebcd':'#ffd393';markerMat.color.set(color);pointer.material.color.set(color);courseMat.color.set(color);
    const park=(['stop','exit'].includes(getawayRoute[getaway]?.kind)||job?.kind==='park'||!job&&!tracked&&step?.kind==='park');
    vinyl.visible=Boolean(job?.kind==='hunt'&&target);if(vinyl.visible)vinyl.position.set(target.x,.64,target.z);
    courseGate.visible=Boolean(target&&(getaway>=0&&!['stop','exit'].includes(getawayRoute[getaway]?.kind)||job?.kind==='drive'||!job&&!tracked&&step?.kind==='drive'));
    bay.visible=Boolean(park&&target);
    const card=$('#getaway-card');card.hidden=getaway<0;
    if(getaway>=0){const tip=getawayRoute[getaway];card.dataset.step=String(getaway);$('#getaway-title').textContent=tip.label;$('#getaway-tip').textContent=tip.tip;$('#getaway-key').textContent=tip.keys;$('#getaway-touch').textContent=tip.touch;card.querySelectorAll('.getaway-progress i').forEach((p,i)=>p.className=i<getaway?'done':i===getaway?'now':'');}
    if(target){marker.position.set(target.x,.24,target.z);pointer.position.set(target.x,2.65,target.z);bay.position.set(target.x,0,target.z);courseGate.position.set(target.x,.03,target.z);if(courseGate.visible){const prev=getaway>0?getawayRoute[getaway-1]:job?(job.route[job.i-1]||job):{x:target.x,z:target.z+5};courseGate.rotation.y=directionTo(target,prev);}}
  }
  function activeDaviPoint(){
    if(daviTask)return daviTask.work.stops[daviTask.index];
    const open=daviWork.filter(x=>!progressState.davi?.[x.id]);
    const p=player.root.position;return open.map(x=>x.stops[0]).sort((a,b)=>dist(p.x,p.z,a)-dist(p.x,p.z,b))[0]||null;
  }
  const daviReserved=()=>mode===0&&Boolean(meetup&&!meetup.finished&&elapsed<meetup.started+21);
  function switchLead(){
    if(film.active||daviReserved()||footHeight>.03||heist||pickup||getaway>=0||disguise||cut||car||onJet||swimming||vault||activeActivity||wardrobeOpen||mapOpen||guideOpen||radioOpen||puzzle||paused||wheel.isOpen()||navSwitch||wanted.heat>.1)return false;
    clearInput();clearRideTalk();const next=lead==='Luzia'?'Davi':'Luzia';navSwitch={t:0,changed:false,from:player.root.position.clone(),fromCam:cam.position.clone(),next};
    host.classList.add('switching');const cover=$('.switch-cover');cover.querySelector('strong').textContent=next;cover.hidden=false;return true;
  }
  function switchFrame(dt){
    const sw=navSwitch;sw.t+=dt;
    const reveal=!fullMotion&&matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(sw.t>=.96&&!sw.changed){
      sw.changed=true;player.root.visible=false;
      if(sw.next==='Luzia'&&currentStep()?.label==='Falar com Davi'){davi.root.position.set(kioskDavi.x,.125,kioskDavi.z);davi.root.rotation.y=Math.PI*.75;}
      lead=sw.next;player=lead==='Luzia'?luzia:daviPlayer;player.root.visible=true;
      viewYaw=player.root.rotation.y;elevation=.36;walk=footHeight=jumpVelocity=0;player.root.rotation.x=player.root.rotation.z=0;host.classList.remove('in-air');refresh();world.lod(player.root.position.x,player.root.position.z,false);
    }
    if(sw.t>2.05){navSwitch=null;$('.switch-cover').hidden=true;host.classList.remove('switching');camera(dt,true);return;}
    const t=sw.t<.96?T.MathUtils.smootherstep(sw.t,0,.96):1-T.MathUtils.smootherstep(sw.t,.96,2.05);
    const root=sw.changed?player.root.position:sw.from,alpha=T.MathUtils.smoothstep(t,.46,.81);
    $('.switch-cover').style.opacity=String(alpha);if(reveal){camera(dt,true);return;}
    if(sw.changed){camera(dt,true);cam.position.y+=58*t;cam.position.z+=11*t;}
    else{cam.position.copy(sw.fromCam);cam.position.y+=58*t;cam.position.z+=11*t;}
    cam.lookAt(root.x,root.y+1.25,root.z);world.sky.position.copy(cam.position);
  }
  function nextStory(){
    if(++storyStep>=campaign[stage].steps.length){stage++;storyStep=0;toast(stage===campaign.length?'Capítulo concluído':'Missão concluída',stage===campaign.length?'A cidade continua aberta.':campaign[stage].name);sfx('complete');}
    else sfx('select');
    progressState.introSeen=true;saveProgress();refresh();
  }
  function endJob(){
    const job=activeActivity;
    if(!progressState.side[job.id])credit+=job.reward;
    progressState.side[job.id]=(progressState.side[job.id]||0)+1;saveProgress();
    activeActivity=null;tracked=null;refresh();sfx('complete');toast('Atividade concluída',`${job.name} · carteira $${credit}`);
  }
  function nextJob(){if(++activeActivity.i>=activeActivity.route.length)endJob();else{refresh();sfx('select');}}
  function guide(open){
    if(film.active||heist||cut||getaway>=0||puzzle||paused||radioOpen||mapOpen||wardrobeOpen||wheel.isOpen())return;
    guideOpen=open;clearInput();releaseMouse();$('#jobs-panel').hidden=!open;host.classList.toggle('overlay-open',open);
    if(!open){cv.focus();return;}
    $('#city-status').textContent=`${Object.values(progressState.side).filter(Boolean).length}/${sideJobs.length} concluídas · carteira $${credit} · marque um destino para ir até lá`;
    $('#cancel-job').hidden=!activeActivity;
    $('#jobs-list').innerHTML=sideJobs.map(a=>`<article><i>${a.glyph}</i><div><strong>${a.name}</strong><small>${a.area} / ${progressState.side[a.id]?'CONCLUÍDA':`$${a.reward}`}</small><p>${a.desc}</p></div><button class="secondary" data-track="${a.id}" ${activeActivity?'disabled':''}>${tracked?.id===a.id?'Desmarcar':'Marcar'}</button></article>`).join('');
    $('#close-jobs').focus();
  }
  function openPuzzle(def,done){
    clearInput();releaseMouse();puzzle={def,done,i:0,tick:0,locked:false};host.classList.add('overlay-open');$('#puzzle-panel').hidden=false;
    $('#puzzle-title').textContent=def.title;$('#puzzle-clue').textContent=def.clue;
    $('#puzzle-keys').innerHTML=def.symbols.map((k,i)=>`<button class="secondary" data-puzzle="${i}">${k}</button>`).join('');
    $('#replay-puzzle').hidden=!def.preview;$('#puzzle-feedback').textContent=`0 / ${def.order.length}`;
    if(def.preview)showSequence();$('#close-puzzle').focus();
  }
  function showSequence(){
    if(!puzzle)return;const state=puzzle,gen=++state.tick;state.i=0;state.locked=true;
    const keys=[...$('#puzzle-keys').children];keys.forEach(k=>{k.disabled=true;k.classList.remove('lit');});$('#puzzle-feedback').textContent='Observe a sequência…';
    state.def.order.forEach((num,i)=>{setTimeout(()=>{if(puzzle!==state||state.tick!==gen)return;keys[num].classList.add('lit');sfx('select');},350+i*615);setTimeout(()=>{if(puzzle===state&&state.tick===gen)keys[num].classList.remove('lit');},730+i*615);});
    setTimeout(()=>{if(puzzle!==state||state.tick!==gen)return;state.locked=false;keys.forEach(k=>k.disabled=false);$('#puzzle-feedback').textContent='Sua vez.';},400+state.def.order.length*615);
  }
  function closePuzzle(cancel=false){if(!puzzle)return;const {done}=puzzle;puzzle=null;$('#puzzle-panel').hidden=true;host.classList.remove('overlay-open');cv.focus();if(!cancel)done();}
  function puzzlePress(i){if(!puzzle||puzzle.locked)return;const correct=puzzle.def.order[puzzle.i];
    if(i!==correct){puzzle.i=0;$('#puzzle-feedback').textContent='Não foi essa. Tente de novo desde o começo.';sfx('bump');return;}
    sfx('select');if(++puzzle.i===puzzle.def.order.length){closePuzzle();return;}$('#puzzle-feedback').textContent=`${puzzle.i} / ${puzzle.def.order.length}`;
  }
  function toast(title,text){const el=$('.toast');el.replaceChildren(Object.assign(document.createElement('strong'),{textContent:title}),Object.assign(document.createElement('span'),{textContent:text}));el.hidden=false;toasts=elapsed+4.1;}
  let lineTimer,dialogueToken=0;
  function cancelDialogue(){clearTimeout(lineTimer);dialogueToken++;speech.stop();}
  function story(lines,done,place='meetup',ride=null,at=null){
    releaseMouse();clearInput();cut={lines,done,i:0,place,ride,age:0,hiddenActors:[[player.root,player.root.visible],[davi.root,davi.root.visible],[nara.root,nara.root.visible]]};
    for(const [actor] of cut.hiddenActors)actor.visible=false;
    cinema.start(place,at||ride?.root.position||player.root.position,outfit,ride?.root);const [name,time]=sceneLabel(place);$('#scene-name').textContent=name;$('#scene-time').textContent=time;
    $('.caption').hidden=$('.scene-location').hidden=false;host.classList.add('cinematic');host.classList.toggle('casino-cinematic',place==='casino');if(place==='casino')$('.scene-location').hidden=true;dialogue();
  }
  function dialogue(resume=false){
    if(!cut||paused)return;clearTimeout(lineTimer);const token=++dialogueToken;
    const [speaker,line,mood]=cut.lines[cut.i];
    if(!resume)cinema.line(speaker,cut.i,mood);
    $('#speaker').textContent=speaker==='Avelar'?'Avelar · voz na fita':speaker;$('#line').textContent=line;
    $('#advance').innerHTML=`${cut.i===cut.lines.length-1?'Concluir':'Avançar'} <kbd class="desktop-hint">E</kbd> ${icon('chevron-right')}`;
    const readTime=Math.max(1800,900+line.split(/\s+/).length*285);
    const schedule=(ms,guard=0)=>{
      if(token!==dialogueToken||!cut||paused)return;clearTimeout(lineTimer);
      const track=$('.line-track');track.getAnimations().forEach(animation=>animation.cancel());track.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:ms,fill:'forwards'});
      lineTimer=setTimeout(()=>{if(token===dialogueToken&&!paused)advance();},ms+guard);
    };
    // Allow time to fetch and decode the first recording before using the subtitle fallback.
    schedule(readTime,9500);
    speech.say(line,speaker,{onStart:duration=>schedule(duration?duration*1000+310:readTime,2800),onEnd:()=>{
      if(token!==dialogueToken||paused)return;clearTimeout(lineTimer);lineTimer=setTimeout(()=>{if(token===dialogueToken&&!paused)advance();},310);
    },onUnavailable:()=>schedule(readTime)});
    speech.preload(cut.lines[cut.i+1]?.[1]);
  }
  function advance(){
    if(!cut||paused)return;cancelDialogue();if(++cut.i<cut.lines.length){dialogue();return;}
    const {done,hiddenActors,ride}=cut;cut=null;
    if(ride){cam.getWorldDirection(handoffLook).multiplyScalar(9).add(cam.position);followBlend=1.3;}
    cinema.stop(Boolean(ride));for(const [actor,visible] of hiddenActors)actor.visible=visible;
    $('.caption').hidden=$('.scene-location').hidden=true;host.classList.remove('cinematic','casino-cinematic');
    if(!ride){cam.fov=63;cam.updateProjectionMatrix();camera(.02,true);}done?.();
  }
  function scheduleRide(ms,done){
    clearTimeout(rideTimer);rideFinish=done;rideRemaining=ms;
    if(paused)return;
    rideDeadline=performance.now()+ms;
    rideTimer=setTimeout(()=>{rideFinish=null;done();},ms);
  }
  function pauseRide(v){
    if(v){clearTimeout(rideTimer);if(rideFinish)rideRemaining=Math.max(0,rideDeadline-performance.now());}
    else if(rideFinish)scheduleRide(rideRemaining,rideFinish);
    speech.pause(v);
  }
  function clearRideTalk(){streetTalker=null;clearTimeout(rideTimer);rideFinish=null;rideLine++;$('.ride-caption').hidden=true;speech.stop();}
  function rideTalk(index){
    if(!getawayLines[index])return;clearRideTalk();const id=rideLine,[name,text]=getawayLines[index],caption=$('.ride-caption');
    caption.querySelector('small').textContent=name;caption.querySelector('p').textContent=text;caption.hidden=false;
    const hide=delay=>scheduleRide(delay,()=>{if(id===rideLine)caption.hidden=true;});
    hide(7000);speech.say(text,name,{onStart:seconds=>hide(Math.max(2900,(seconds||4.5)*1000+530)),onEnd:()=>hide(580),onUnavailable:()=>hide(5400)});
  }
  function startGetaway(){
    pickup=false;
    if(!openingCar){progressState.casinoSeen=progressState.getawaySeen=progressState.introSeen=true;saveProgress();return;}
    car=openingCar;driveAge=0;creditBeat=-1;tailGuide=0;radio.choose(4);yaw=viewYaw=car.root.rotation.y;driving={steer:0,vx:0,vz:-4.6};speed=0;driving=cleanState();player.root.visible=false;
    getaway=0;car.root.add(escapeMate.root);escapeMate.root.position.set(.39,-.43,.25);escapeMate.root.rotation.set(0,0,0);escapeMate.root.visible=true;host.classList.add('getaway-active');refresh();cv.focus();rideTalk(0);
  }
  function finishGetaway(skip=false){
    if(getaway<0&&!disguise)return;
    if(skip){radio.choose(4);if(car)car.root.position.set(208.7,.08,68.5);if(car)car.root.rotation.y=0;car=null;speed=0;driving=cleanState();player.root.position.set(211.3,.12,74);player.root.rotation.y=viewYaw=0;player.root.visible=true;followBlend=0;camera(.02,true);}
    getaway=-1;disguise=false;escapeMate.root.visible=false;scene.add(escapeMate.root);wanted=cleanWanted();$('.prologue-credits').hidden=true;host.classList.remove('getaway-active');clearRideTalk();if(tailCar)tailCar.root.visible=false;
    progressState.casinoSeen=progressState.getawaySeen=progressState.introSeen=true;saveProgress();refresh();sfx('complete');toast('Despistados','Encontre Davi no Quiosque 06. A cidade está aberta.');
  }
  function setupHeist(){
    const runner=asset?riggedPerson(asset,{performance:true}):person(castStyles.Luzia);runner.outfit?.(outfit.id==='original'?miragemOutfit:outfit);
    titleCue.preload();for(const [,text] of [...casinoAlarm,...casinoDrop,...casinoEntry,...casinoSearch])speech.preload(text);
    host.classList.add('heist-active');$('.casino-title').hidden=false;for(const n of people){n.p.root.visible=false;n.p.root.removeFromParent();}for(const c of cars)c.root.visible=false;player.root.visible=false;world.lod(casinoSite.x,casinoSite.z,true);
    heist=makeHeist(scene,{runner,ally:makeDavi({performance:true}),makeGuard:(cfg,i)=>person({type:1,jacket:'#36455a',skin:['#996a54','#6e4439','#c78c65','#a76b56'][i%4],pants:'#272d3a',extra:{variant:i+1,uniform:true,build:1.01+i*.044,height:.94+i*.024}}),canLand:(x,z)=>!world.collides(x,z,.57)&&!blockedFoot(x,z,.38),announce:toast,effect:sfx,
      selectHint(title,text,key){if(matchMedia('(pointer: coarse)').matches)key=key.replace('WASD MOVER · SHIFT ABAIXAR','ANALÓGICO · ↑ ABAIXA').replace('W A S D / GUIAR','ANALÓGICO / GUIAR').replace('E / INTERAGIR','TOQUE NA MÃO').replace(/ESPAÇO \/ (PULAR|ABRIR)/,'TOQUE EM ↥').replace('WASD · CLIQUE PARA USAR','JOYSTICK · ◎ PARA USAR');const card=$('.casino-tip');card.hidden=!title;card.querySelector('strong').textContent=title;card.querySelector('p').textContent=text;card.querySelector('kbd').textContent=key;},
      onArrival(done){narrative(...casinoEntry[0],6100,()=>{if(heist?.phase==='arrival')narrative(...casinoEntry[1],6500,done);});},
      onSearch(i){if(casinoSearch[i])narrative(...casinoSearch[i],4100);},
      onAlarm(_at,done,speaker){
        clearInput();$('.casino-tip').hidden=true;heistAudio.update('alarm');
        const play=i=>{if(!heist?.alarm)return;if(i===casinoAlarm.length){done();return;}const [name,line]=casinoAlarm[i];speaker(name);narrative(name,line,6500,()=>play(i+1));};
        play(0);
      },
      onDrop(i,done){
        if(cut)return;
        if(i===0){pendingDrop={ready:false,next:false};const item=pendingDrop;narrative(...casinoDrop[0].slice(0,2),2400,()=>{
          if(item!==pendingDrop)return;item.ready=true;if(item.next&&heist?.phase==='air')narrative(...casinoDrop[1].slice(0,2),3300);
        });}else if(i===1&&pendingDrop&&!pendingDrop.ready){pendingDrop.next=true;}
        else{pendingDrop=null;narrative(...casinoDrop[i].slice(0,2),3600,done);}
      },
      onLand({x,z,companion}){completeHeist(x,z,false,companion);}
    });
  }
  function completeHeist(x,z,skip=false,companion){
    heist?.finish();heist=null;pendingDrop=null;titleCue.stop();$('.miragem-logo').hidden=true;renderMiragemGuide();heistAudio.stop();host.classList.remove('heist-active','escape-pressure');delete host.dataset.heist;delete host.dataset.miragemShot;$('.casino-title').hidden=$('.casino-tip').hidden=$('#touch-tool').hidden=true;
    player.root.visible=true;player.root.position.set(x,.12,z);footHeight=jumpVelocity=0;player.root.rotation.set(0,0,0);viewYaw=0;cam.fov=63;cam.updateProjectionMatrix();
    if(skip){getaway=0;car=openingCar;finishGetaway(true);return;}
    if(outfit.id==='original')luzia.outfit?.(miragemOutfit);
    if(companion){escapeMate.root.position.set(companion.x,.12,companion.z);escapeMate.root.rotation.y=companion.yaw;escapeMate.root.visible=true;}
    const p=openingCar.root.position;if(!blockedVehicle(openingCar,dropLine.x,z-4.8,0))p.z=z-4.8;
    if(blockedFoot(x,z,.34))player.root.position.set(p.x+1.7,.12,p.z+1.7);
    pickup=true;cam.getWorldDirection(handoffLook).multiplyScalar(7).add(cam.position);followBlend=1.3;refresh();toast('De volta ao chão','Chegue junto ao carro e aperte E para entrar.');
  }
  function nearest(){
    const p=onJet?jet.root.position:car?.root.position||player.root.position, step=currentStep();
    if(swimming)return dist(p.x,p.z,jet.root.position)<1.9?{type:'jetski',text:'Montar no jet ski'}:null;
    if(onJet)return dist(p.x,p.z,jetskiDock)<5.4&&Math.abs(jetSpeed)<2?{type:'moor',text:'Desembarcar no píer'}:null;
    if(!car&&!pickup&&getaway<0&&!disguise&&dist(p.x,p.z,jetskiDock)<4.25&&dist(p.x,p.z,jet.root.position)<5.2)return {type:'jetski',text:'Pilotar jet ski'};
    if(lead==='Davi'&&!car){
      const mark=activeDaviPoint();
      if(mark&&dist(p.x,p.z,mark)<4.6)return {type:'davi',text:mark.text};
    }
    if(pickup)return dist(p.x,p.z,openingCar.root.position)<4.0?{type:'pickup',text:'Entrar no carro da fuga'}:null;
    if(disguise&&dist(p.x,p.z,wardrobe)<4.1)return {type:'wardrobe',text:'Trocar roupa · despistar'};
    if(getaway>=0)return getawayRoute[getaway]?.kind==='exit'&&car?{type:'exit',text:'Sair do carro'}:null;
    if(!activeActivity&&tracked&&dist(p.x,p.z,tracked)<4.7&&(!car||['drive','park'].includes(tracked.kind)))return {type:'activity',text:`✦ ${tracked.name}`,a:tracked};
    if(!activeActivity&&step&&!['park','drive'].includes(step.kind)&&!car&&dist(p.x,p.z,step)<4.5)return {type:'story',text:step.label,step};
    if(!activeActivity&&!car&&lead==='Luzia'&&dist(p.x,p.z,streetScenes.afterHours)<2.85)return {type:'afterHours',text:'Falar com Nara · Depois do expediente'};
    if(activeActivity && !car && ['hunt','stops','photo'].includes(activeActivity.kind)&&dist(p.x,p.z,target)<4.9)return {type:'job-stop',text:target.label};
    if(!activeActivity)for(const a of sideJobs){if(car&&!['drive','park'].includes(a.kind))continue;if(dist(p.x,p.z,a)<4.7)return {type:'activity',text:`✦ ${a.name}`,a};}
    if(!car&&dist(p.x,p.z,home)<3.0)return {type:'home',text:'Descansar · Casa de Luzia e Davi'};
    if(!car){const spot=streetSpots.find(a=>dist(p.x,p.z,a)<2.45);if(spot)return {type:'spot',spot,text:spot.action};}
    if(!car&&dist(p.x,p.z,wardrobe)<4.1)return {type:'wardrobe',text:'Trocar roupa · Vestiário Neon'};
    if(car)return {type:'exit',text:Math.abs(speed)>2.8?'Pare para sair':'Sair do carro'};
    let closest=3.8, chosen;for(const c of cars){if(c.patrol||c===tailCar)continue;const d=dist(p.x,p.z,c.root.position);if(d<closest){closest=d;chosen=c;}}if(chosen)return {type:'car',car:chosen,text:'Entrar no carro'};
    const nearby=people.find(n=>n.p.root.visible&&n.p.root.position.distanceTo(p)<2.35&&clearStreetLine(p,n.p.root.position));
    return nearby?{type:'pedestrian',npc:nearby,text:'Conversar'}:null;
  }
  function interact(){
    if(film.active)return;if(cut){advance();return;}if(heist){if(!wheel.isOpen()&&!paused)heist.interact();return;}if(paused||mapOpen||guideOpen||radioOpen||wardrobeOpen||puzzle||wheel.isOpen())return;const c=nearest();if(!c)return;
    if(c.type==='afterHours'){if(waypoint===streetScenes.afterHours)setWaypoint(null);film.start('afterHours',outfit);return;}
    if(c.type==='pedestrian'){sayStreet(c.npc,'orla');return;}
    if(c.type==='pickup'){startGetaway();sfx('door');return;}
    if(c.type==='home'){clockSkipGoal+=190;saveProgress();toast('Nossa casa','Você descansou. O relógio avançou algumas horas.');return;}
    if(c.type==='jetski'){swimming=false;host.classList.remove('swimming');onJet=true;jetSpeed=0;viewYaw=jet.root.rotation.y;clearInput();sfx('door');toast('Jet ski · Ocean Beach','Acelere e vire no mar; retorne ao píer marcado para descer.');return;}
    if(c.type==='moor'){onJet=false;jetSpeed=0;jet.root.position.set(jetskiDock.x,.03,jetskiDock.z);jet.root.rotation.y=-Math.PI/2;player.root.position.set(jetskiDock.x-3,.125,jetskiDock.z);sfx('door');return;}
    if(c.type==='davi'){
      if(!daviTask){const work=daviWork.find(w=>w.stops[0]===activeDaviPoint());if(!work)return;daviTask={work,index:0};toast(work.name,work.intro);}
      else{const {work,index}=daviTask;const stop=work.stops[index];if(++daviTask.index>=work.stops.length){progressState.davi={...progressState.davi,[work.id]:true};daviTask=null;credit+=110;saveProgress();sfx('complete');}else sfx('select');toast(work.name,stop.detail);}
      refresh();return;
    }
    if(c.type==='story'){if(lead==='Davi')return;
      tracked=null;refresh();player.interact?.();
      if(c.step.kind==='puzzle')openPuzzle(c.step.puzzle,nextStory);
      else if(c.step.lines&&stage===0&&storyStep===0){
        film.start('kiosk',outfit,c.step.lines,()=>{meetup={leave:true,finished:true,leg:0,started:elapsed};nextStory();});
      }else if(c.step.lines)story(c.step.lines,nextStory,stage===0&&storyStep===3?'briefcase':['meetup','cafe','dock','tape'][stage]);
      else nextStory();
    }else if(c.type==='spot'){
      const {id,name}=c.spot;
      if(id==='jukebox'){const now=radio.change();toast(name,`No ar: ${now.station}${now.title?' · '+now.title:''}`);}
      if(id==='coffee'){sfx('select');toast(name,'Café passado na hora. A dona da janela recomenda o fliperama mais adiante.');}
      if(id==='market'){sfx('select');toast(name,'Hoje no cais: peixe-espada, camarão e um cartão-postal perfeito às 19h. O mirante fica mais ao sul.');}
    }else if(c.type==='wardrobe'){openWardrobe(true);sfx('select');}
    else if(c.type==='car'){car=c.car;speed=0;driving=cleanState();yaw=car.root.rotation.y;viewYaw=yaw;freeCamera=0;player.root.visible=false;sfx('door');toast(radio.info().station,radio.info().title);}
    else if(c.type==='exit'&&Math.abs(speed)<=2.8){
      const p=car.root.position,cs=Math.cos(yaw),sn=Math.sin(yaw);
      const candidates=[[1.62,0],[-1.62,0],[1.65,-1],[-1.65,-1],[0,2.66],[0,-2.66]];
      const point=candidates.map(([side,back])=>[p.x+cs*side+sn*back,p.z-sn*side+cs*back]).find(([x,z])=>!blockedFoot(x,z,.36));
      if(!point){toast('Sem espaço para sair','Afaste o carro da parede ou do outro veículo.');return;}
      player.root.position.set(point[0],.12,point[1]);player.root.rotation.y=yaw;player.root.visible=true;car=null;speed=0;driving=cleanState();sfx('door');if(getawayRoute[getaway]?.kind==='exit'){escapeMate.root.visible=false;scene.add(escapeMate.root);getaway=-1;disguise=true;initialDisguise=outfit.id;host.classList.remove('getaway-active');refresh();toast('Troque a aparência','Vista outra roupa no Vestiário Neon para completar a fuga.');}
    }
    else if(c.type==='activity'){
      if(['drive','park'].includes(c.a.kind)&&(!car||Math.abs(speed)>2.8)){toast(c.a.name,'Pare no ponto de partida dentro de um carro.');return;}
      activeActivity={...c.a,i:0};tracked=null;timer=c.a.time||0;refresh();
      if(c.a.puzzle)openPuzzle(c.a.puzzle,endJob);else{toast(c.a.name,c.a.desc);sfx('select');}
    }else if(c.type==='job-stop'){
      if(activeActivity.kind==='photo'){
        const angle=directionTo(player.root.position,{x:247,z:-258});
        if(angularError(viewYaw,angle)>.26){toast('Fora de quadro','Gire a câmera até a roda-gigante ficar no centro.');return;}
        const file=document.createElement('a');renderer.render(scene,cam);file.href=renderer.domElement.toDataURL('image/jpeg',.86);file.download='postal-porto-violeta.jpg';file.click();
      }
      sfx('select');nextJob();
    }
  }
  function drawings(can,big){
    const ctx=can.getContext('2d'),w=can.width,h=can.height,p=car?.root.position||player.root.position;
    ctx.fillStyle='#28213d';ctx.fillRect(0,0,w,h);const project=mapProjection(w,h,XS,ZS,big?null:p,big?mapViewport:null),sc=project.scale,fx=project.x,fz=project.z;
    const rect=(x,z,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(fx(x),fz(z),ww*sc,hh*sc);};
    const minZ=ZS[0]-16,span=ZS.at(-1)-minZ+17;rect(253,minZ,250,span,'#34456a');rect(213,minZ,40,span,'#735368');rect(XS[0]-12,minZ,225-XS[0],span,'#332641');
    for(const lot of world.mapLots){if(!big&&(Math.abs(lot.x-p.x)>100||Math.abs(lot.z-p.z)>95))continue;rect(lot.x-lot.w/2,lot.z-lot.d/2,lot.w,lot.d,{park:'#415f56',port:'#4e5869',coast:'#5a405a',urban:'#39304d'}[lot.kind]);}
    for(const b of world.blocks){if(!big&&(Math.abs(b.x-p.x)>92||Math.abs(b.z-p.z)>80))continue;rect(b.x-b.w/2,b.z-b.d/2,b.w,b.d,'#4c3d61');}
    for(const [x,z,bx,bz] of world.mapStreets)rect(Math.min(x,bx)-6,Math.min(z,bz)-6,Math.abs(bx-x)+12,Math.abs(bz-z)+12,'#786884');
    for(const lot of world.mapReclaimed)rect(lot.x-lot.w/2,lot.z-lot.d/2,lot.w,lot.d,lot.kind==='park'?'#415f56':'#4e5869');
    ctx.strokeStyle='#aa917c';ctx.lineWidth=Math.max(1.5,sc*9);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();world.reserveRoad.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo'](fx(x),fz(z)));ctx.stroke();
    if(big){ctx.font='600 11px Inter';ctx.textAlign='center';for(const d of districts){ctx.strokeStyle='#2a203c';ctx.lineWidth=3;ctx.strokeText(d.name,fx(d.x),fz(d.z));ctx.fillStyle='#e6d3e4';ctx.fillText(d.name,fx(d.x),fz(d.z));}}
    for(const a of sideJobs){ctx.fillStyle=progressState.side[a.id]?'#b2afca':'#a7ebd6';ctx.beginPath();ctx.arc(fx(a.x),fz(a.z),big?5:3,0,Math.PI*2);ctx.fill();if(big){ctx.font='700 8px Inter';ctx.textAlign='center';ctx.fillStyle='#25163e';ctx.fillText(a.glyph,fx(a.x),fz(a.z)+3);}}
    for(const spot of streetSpots)if(big||dist(p.x,p.z,spot)<78){ctx.fillStyle='#a0d5e6';ctx.font=big?'700 12px Inter':'700 10px Inter';ctx.textAlign='center';ctx.fillText(spot.glyph,fx(spot.x),fz(spot.z));}
    if(big||dist(p.x,p.z,wardrobe)<69){ctx.fillStyle='#ff91ca';ctx.fillRect(fx(wardrobe.x)-3.5,fz(wardrobe.z)-3.5,7,7);if(big){ctx.font='700 9px Inter';ctx.textAlign='right';ctx.fillText('Vestiário',fx(wardrobe.x)-5,fz(wardrobe.z)+3);}}
    if(waypoint){const route=urbanRoute(p,waypoint);ctx.save();ctx.lineWidth=big?2.9:2;ctx.strokeStyle='#82dfff';ctx.lineJoin=ctx.lineCap='round';ctx.beginPath();route.forEach((q,i)=>i?ctx.lineTo(fx(q.x),fz(q.z)):ctx.moveTo(fx(q.x),fz(q.z)));ctx.stroke();ctx.fillStyle='#abf0ff';ctx.beginPath();ctx.arc(clamp(fx(waypoint.x),7,w-7),clamp(fz(waypoint.z),7,h-7),big?5:3.5,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(big||dist(p.x,p.z,jetskiDock)<90){ctx.fillStyle='#92ebe4';ctx.font='700 12px Inter';ctx.textAlign='center';ctx.fillText('≈',fx(jetskiDock.x),fz(jetskiDock.z));}
    if(big||dist(p.x,p.z,home)<75){ctx.fillStyle='#faace4';ctx.font='700 12px Inter';ctx.textAlign='center';ctx.fillText('⌂',fx(home.x),fz(home.z));}
    if(target){const x=clamp(fx(target.x),8,w-8),z=clamp(fz(target.z),8,h-8);ctx.fillStyle='#ffd18f';ctx.save();ctx.translate(x,z);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();}
    ctx.save();ctx.translate(fx(p.x),fz(p.z));ctx.rotate(-(car?yaw:player.root.rotation.y));ctx.fillStyle='#fff0ee';ctx.strokeStyle='#472644';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,3);ctx.lineTo(-5,5);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
  }
  function clearInput(){keys.clear();touch.run=false;resetStick();}
  function map(open){if(film.active||heist||cut||paused||guideOpen||puzzle||wardrobeOpen||radioOpen||wheel.isOpen())return;mapOpen=open;clearInput();releaseMouse();$('.map-panel').hidden=!mapOpen;host.classList.toggle('map-open',mapOpen);if(open){drawings($('#bigmap'),true);$('#close-map').focus();}else cv.focus();}
  function radioInfo(){const {station,title,artist,channel}=radio.info();$('#now-playing').textContent=title?`${station} · ${title} — ${artist}`:station;$('#skip-radio').hidden=!title;$('#stations').innerHTML=radio.stations.map(({name,tag,tracks},i)=>`<article><i>♫</i><div><strong>${name}</strong><small>${tag} ${tracks.length?`· ${tracks.length} FAIXAS`:''}</small></div><button class="secondary" data-radio="${i}" aria-pressed="${i===channel}">${i===channel?'No ar':'Sintonizar'}</button></article>`).join('');}
  function radioPanel(open){if(film.active||heist||cut||guideOpen||mapOpen||puzzle||paused||wardrobeOpen||wheel.isOpen())return;radioOpen=open;clearInput();releaseMouse();$('#radio-panel').hidden=!open;host.classList.toggle('overlay-open',open);if(open){radioInfo();$('#close-radio').focus();}else cv.focus();}
  function nextRadio(){const track=radio.change();toast(track.station,track.title);}
  bind($('#skip-casino'),'click',()=>completeHeist(211.3,74,true));
  bind($('#clear-waypoint'),'click',()=>setWaypoint(null));
  function mapCoords(e){const can=$('#bigmap'),r=can.getBoundingClientRect();return {can,x:(e.clientX-r.left)*can.width/r.width,y:(e.clientY-r.top)*can.height/r.height};}
  function mapScale(u,v,d){const can=$('#bigmap');mapViewport=zoomMap(can.width,can.height,XS,ZS,mapViewport,u,v,d);$('#map-scale').value=`${Math.round((mapViewport?.zoom||1)*100)}%`;drawings(can,true);}
  bind($('#bigmap'),'click',e=>{const {can,x,y}=mapCoords(e);setWaypoint(mapProjection(can.width,can.height,XS,ZS,null,mapViewport).pick(x,y));sfx('select');});
  bind($('#bigmap'),'wheel',e=>{if(!mapOpen)return;e.preventDefault();const {x,y}=mapCoords(e);mapScale(x,y,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?150:1));},{passive:false});
  bind($('#bigmap'),'keydown',e=>{if(e.code==='Delete'){e.preventDefault();setWaypoint(null);}if(['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(e.code)){e.preventDefault();const can=e.currentTarget;mapScale(can.width/2,can.height/2,e.code==='Equal'||e.code==='NumpadAdd'?-115:115);}});
  for(const [id,d] of [['zoom-in',-115],['zoom-out',115]])bind($('#'+id),'click',()=>{const can=$('#bigmap');mapScale(can.width/2,can.height/2,d);});
  bind($('#skip-getaway'),'click',()=>finishGetaway(true));
  bind($('#hud-wheel'),'click',()=>toolWheel.open());
  bind($('#close-wardrobe'),'click',()=>openWardrobe(false));bind($('#wardrobe-list'),'click',e=>{const id=e.target.closest('[data-outfit]')?.dataset.outfit;if(!id||outfit.id===id)return;const next=outfits.find(o=>o.id===id);if(!next)return;outfit=next;luzia.outfit?.(outfit);progressState.outfit=id;saveProgress();if(disguise&&id!==initialDisguise)finishGetaway();drawWardrobe();$('#wardrobe-list').querySelector(`[data-outfit="${id}"]`)?.focus();sfx('select');});
  bind($('#hud-switch'),'click',switchLead);
  bind($('#hud-pause'),'click',()=>{if(mapOpen)map(false);onPause();});
  bind($('#hud-jobs'),'click',()=>guide(!guideOpen));bind($('#close-jobs'),'click',()=>guide(false));
  bind($('#jobs-list'),'click',e=>{const id=e.target.closest('[data-track]')?.dataset.track;if(!id||activeActivity)return;tracked=tracked?.id===id?null:sideJobs.find(a=>a.id===id);guide(false);refresh();if(tracked)toast(tracked.name,'Siga o marcador verde.');});
  bind($('#after-hours'),'click',()=>{
    guide(false);setWaypoint(streetScenes.afterHours);toast('Depois do expediente','Encontre a Nara na calçada do Café Sereia, jogando com a Luzia.');
  });
  bind($('#cancel-job'),'click',()=>{activeActivity=null;tracked=null;refresh();guide(false);toast('Atividade abandonada','Você pode voltar e tentar novamente.');});
  bind($('#close-puzzle'),'click',()=>{const side=activeActivity?.kind==='puzzle';closePuzzle(true);if(side){activeActivity=null;refresh();}});bind($('#replay-puzzle'),'click',showSequence);
  bind($('#puzzle-keys'),'click',e=>{const i=e.target.closest('[data-puzzle]')?.dataset.puzzle;if(i!==undefined)puzzlePress(+i);});bind($('#hud-radio'),'click',()=>radioPanel(!radioOpen));bind($('#close-radio'),'click',()=>radioPanel(false));bind($('#skip-radio'),'click',()=>{radio.skip();radioInfo();});bind($('#stations'),'click',e=>{const i=e.target.closest('[data-radio]')?.dataset.radio;if(i!==undefined){radio.choose(+i);radioInfo();}});bind($('#hud-map'),'click',()=>map(!mapOpen));bind($('.minimap'),'click',()=>map(!mapOpen));bind($('#close-map'),'click',()=>map(false));bind($('#advance'),'click',advance);bind($('.interact'),'click',interact);
  bind(window,'keydown',e=>{
    if(film.active){if(e.code==='Escape'&&!e.repeat){e.preventDefault();film.skip();}return;}
    if(paused)return;
    if(['ControlLeft','ControlRight'].includes(e.code)){e.preventDefault();if(!e.repeat&&toolWheel.open())ctrlHeld=true;return;}
    if(wheel.key(e))return;
    if(cut){if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();onPause();}else if(!e.repeat&&['KeyE','Space'].includes(e.code)){e.preventDefault();advance();}return;}
    if(wardrobeOpen){if(e.code==='Escape'){e.preventDefault();openWardrobe(false);}return;}
    if(radioOpen){if(e.code==='Escape'||e.code==='KeyR'){e.preventDefault();radioPanel(false);}return;}
    if(puzzle){if(e.code==='Escape'){e.preventDefault();$('#close-puzzle').click();}return;}
    if(guideOpen){if(e.code==='Escape'||e.code==='KeyJ'){e.preventDefault();guide(false);}return;}
    if(['ArrowUp','ArrowRight','ArrowLeft','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyE','KeyM','KeyR','KeyJ','KeyQ','KeyF','KeyP','Escape'].includes(e.code))e.preventDefault();
    if(!e.repeat){if(e.code==='Escape'){if(document.pointerLockElement===cv){releaseMouse();return;}if(mapOpen)map(false);else onPause();return;}if(e.code==='KeyM'){map(!mapOpen);return;}if(e.code==='KeyJ'){if(mapOpen)map(false);guide(true);return;}if(e.code==='KeyR'){nextRadio();return;}if(e.code==='KeyQ'){radioWheel.open();return;}if(e.code==='KeyP'){onPause();return;}if(e.code==='KeyF'){if(document.pointerLockElement===cv)releaseMouse();else requestMouse();return;}if(e.code==='KeyE'&&!mapOpen){interact();return;}if(e.code==='Space'&&!car){jump();return;}if(e.code==='KeyX'){if(cameraEnabled())useTool();return;}if(e.code==='KeyV'){switchLead();return;}if(e.code==='F8'&&devTools){e.preventDefault();clockSkipGoal+=300;toast('Modo livre / dev','Relógio da cidade avançado em 5 horas.');return;}}
    keys.add(e.code);
  });bind(window,'keyup',e=>{keys.delete(e.code);if(ctrlHeld&&['ControlLeft','ControlRight'].includes(e.code)&&!e.ctrlKey){ctrlHeld=false;toolWheel.close(true);}});bind(window,'blur',()=>{if(ctrlHeld){ctrlHeld=false;toolWheel.close(false);}keys.clear();touch.x=touch.y=0;touch.run=false;});
  const stick=$('#stick'), knob=stick.firstElementChild;
  const setStick=e=>{const r=stick.getBoundingClientRect();const dx=(e.clientX-r.left-r.width/2),dy=(e.clientY-r.top-r.height/2),lim=r.width*.33,m=Math.max(1,Math.hypot(dx,dy)/lim);touch.x=dx/m/lim;touch.y=dy/m/lim;knob.style.transform=`translate(${dx/m}px,${dy/m}px)`;};
  bind(stick,'pointerdown',e=>{stick.setPointerCapture(e.pointerId);setStick(e);});bind(stick,'pointermove',e=>{if(stick.hasPointerCapture(e.pointerId))setStick(e);});
  const resetStick=()=>{touch.x=touch.y=0;knob.style.transform='';};bind(stick,'lostpointercapture',resetStick);
  bind($('#touch-act'),'click',interact);bind($('#touch-jump'),'click',jump);bind($('#touch-tool'),'click',useTool);const run=$('#touch-run');bind(run,'pointerdown',e=>{run.setPointerCapture(e.pointerId);touch.run=true;});bind(run,'lostpointercapture',()=>{touch.run=false;});
  cv.tabIndex=-1;
  function cameraEnabled(){return !(film.active||['title','arrival','alarm','land'].includes(heist?.phase)||paused||mapOpen||guideOpen||radioOpen||wardrobeOpen||puzzle||cut||navSwitch||wheel.isOpen());}
  function lookBy(dx,dy,touchMode=false){
    if(!dx&&!dy)return;
    const sens=touchMode?.0068:.0017+mouseSensitivity*.000051;
    viewYaw-=clamp(dx,-100,100)*sens;
    elevation=clamp(elevation+clamp(dy,-92,92)*sens*.72,-.22,1.04);freeCamera=3;
  }
  bind(document,'pointerlockchange',()=>{lockBusy=false;const grabbed=document.pointerLockElement===cv;host.classList.toggle('mouse-locked',grabbed);if(grabbed)$('#lock-note').hidden=true;lockHint();});
  bind(document,'pointerlockerror',()=>{if(lockBusy)lockError();});
  bind(cv,'pointerdown',e=>{if(!cameraEnabled())return;if(e.button===1){e.preventDefault();return;}if(e.pointerType!=='touch')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture(e.pointerId);});
  // Desktop movement belongs to the locked canvas only; an unlocked cursor is menu input.
  bind(document,'mousemove',e=>{if(document.pointerLockElement===cv&&cameraEnabled())lookBy(e.movementX||0,e.movementY||0);});
  bind(cv,'pointermove',e=>{
    if(e.pointerType!=='touch'||!cameraEnabled()||drag?.id!==e.pointerId)return;
    lookBy(e.clientX-drag.x,e.clientY-drag.y,true);drag.x=e.clientX;drag.y=e.clientY;
  });
  bind(cv,'lostpointercapture',e=>{if(drag?.id===e.pointerId)drag=null;});
  bind(cv,'click',e=>{
    if(e.button!==0||e.pointerType==='touch'||!cameraEnabled())return;
    if(document.pointerLockElement!==cv){if(!lockDenied)requestMouse();return;}
    useTool();
  });
  bind(cv,'contextmenu',e=>{if(!cameraEnabled()||document.pointerLockElement!==cv)return;e.preventDefault();const actor=(car?.root||player.root);viewYaw=actor.rotation.y;elevation=.37;freeCamera=0;});
  bind(cv,'auxclick',e=>{if(e.button===1){e.preventDefault();radioWheel.open();}});
  bind(host,'wheel',e=>wheel.scroll(e),{passive:false});
  function resize(){const w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;cam.aspect=w/h;cam.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.65:.82));renderer.setSize(w,h);}
  function settings(c){quality=c.quality;fullMotion=c.fullMotion;devTools=c.devMode&&mode!==0;const b=Number(c.brightness);renderer.toneMappingExposure=(mode===2?.94:1.04)*(.69+clamp(Number.isFinite(b)?b:58,0,100)*.0061);mouseSensitivity=clamp(Number(c.mouse)||55,10,100);renderer.shadowMap.enabled=quality==='high';for(const sh of shadows){sh.actor.traverse(o=>{if(o.isMesh)o.material.needsUpdate=true;});}resize();}
  bind(window,'resize',resize);settings(config);
  function blockedFoot(x,z,r,except=null,npcMover=null){
    if(world.collides(x,z,r)||pursuitActive&&circleBox(x,z,r,carShape(enforcer.root.position.x,enforcer.root.position.z,enforcer.root.rotation.y)))return true;
    if(npcMover===null&&people.some(n=>{const p=n.p.root.position;return n.p.root.visible&&Math.hypot(p.x-x,p.z-z)<r+.31;}))return true;
    if(npcMover&&(Math.hypot(player.root.position.x-x,player.root.position.z-z)<r+.36&&!car&&!onJet||people.some(n=>n!==npcMover&&n.p.root.visible&&Math.hypot(n.p.root.position.x-x,n.p.root.position.z-z)<r+.23)))return true;
    return cars.some(c=>c!==except&&(c!==tailCar||getaway>=0||cut?.ride)&&Math.abs(c.root.position.x-x)<3&&Math.abs(c.root.position.z-z)<3&&circleBox(x,z,r,carShape(c.root.position.x,c.root.position.z,c.root.rotation.y)));
  }
  function blockedVehicle(c,x,z,heading,avoidPlayer=false){
    if(world.collidesVehicle(x,z,heading))return true;const shape=carShape(x,z,heading);
    if(avoidPlayer&&(!car&&circleBox(player.root.position.x,player.root.position.z,.52,shape)||people.some(n=>n.p.root.visible&&circleBox(n.p.root.position.x,n.p.root.position.z,.45,shape))))return true;
    return cars.some(other=>other!==c&&(other!==tailCar||getaway>=0||cut?.ride)&&Math.abs(other.root.position.x-x)<5&&Math.abs(other.root.position.z-z)<5&&boxesOverlap(shape,carShape(other.root.position.x,other.root.position.z,other.root.rotation.y)));
  }
  function moveFoot(p,dx,dz,r,npcMover=null){const x=p.x,z=p.z;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));for(let i=0;i<n;i++){if(!blockedFoot(p.x+dx/n,p.z,r,null,npcMover))p.x+=dx/n;if(!blockedFoot(p.x,p.z+dz/n,r,null,npcMover))p.z+=dz/n;}return Math.hypot(p.x-x,p.z-z);}
  function axis(plus,minus,t){ return clamp((plus.some(k=>keys.has(k))?1:0)-(minus.some(k=>keys.has(k))?1:0)+t,-1,1); }
  function cameraRange(p,heading,range){
    const dx=Math.sin(heading),dz=Math.cos(heading);
    for(let d=.5;d<=range;d+=.32)if(world.collides(p.x+dx*d,p.z+dz*d,.28,true))return Math.max(.2,d-.4);
    return range;
  }
  const look=new T.Vector3();const desired=new T.Vector3();const prevLight=new T.Vector3(-1000,0,0);let last=performance.now(),mapTick=0;
  function camera(dt,snap=false){
    const p=(onJet?jet.root:car?.root||player.root).position;
    if(wardrobeOpen){
      const front=player.root.rotation.y+.3+Math.PI,side=front-.85;
      const frontRange=cameraRange(p,front,3.5),sideRange=cameraRange(p,side,3.5),h=sideRange>frontRange+.35?side:front,d=h===side?sideRange:frontRange;
      desired.set(p.x+Math.sin(h)*d,p.y+1.87,p.z+Math.cos(h)*d);cam.position.lerp(desired,1-Math.exp(-8*dt));cam.lookAt(p.x,p.y+1.03,p.z);world.sky.position.copy(cam.position);return;
    }
    const heading=viewYaw;
    let range=onJet?8.15:swimming?4.7:car?7.5+Math.min(1.32,Math.abs(speed)*.065):2.67;let height=(onJet?3.12:swimming?2.3:car?2.35:1.13)+elevation*(car?2.35:1.34);
    const side=car||onJet?0:.72,desiredRange=Math.hypot(range,side);let angle=heading+Math.atan2(side,range);
    range=onJet||swimming?desiredRange:cameraRange(p,angle,desiredRange);
    if(side&&range<1.45){const opposite=heading-Math.atan2(side,desiredRange),other=cameraRange(p,opposite,desiredRange);if(other>range+.15){angle=opposite;range=other;}}
    if(!car&&!onJet&&!cut)player.root.visible=range>.67;
    desired.set(p.x+Math.sin(angle)*range,p.y+height,p.z+Math.cos(angle)*range);
    if(snap)cam.position.copy(desired);else cam.position.lerp(desired,1-Math.exp(-(car?5.9:8.6)*dt));
    look.set(p.x-Math.sin(heading)*(car?2.35:.62)+Math.cos(heading)*(car?0:.47),p.y+(car?1.18:1.34),p.z-Math.cos(heading)*(car?2.35:.62)-Math.sin(heading)*(car?0:.47));
    if(activeActivity?.kind==='photo')look.y+=1.5;
    if(followBlend>0&&!snap){followBlend=Math.max(0,followBlend-dt);cam.fov=smooth(cam.fov,63,5.3,dt);cam.updateProjectionMatrix();cameraTarget.copy(look).lerp(handoffLook,T.MathUtils.smoothstep(followBlend/1.3,0,1));cam.lookAt(cameraTarget);}else cam.lookAt(look);world.sky.position.copy(cam.position);
    if(prevLight.distanceTo(p)>7){prevLight.copy(p);world.sun.position.set(p.x+61,91,p.z-51);world.sun.target.position.set(p.x,0,p.z);}
  }
  function chaseCar(unit,target,v,dt){
    const p=unit.root.position,h=directionTo(p,target),heading=turn(unit.root.rotation.y,h,4.8,dt),gap=dist(p.x,p.z,target);
    const rate=Math.min(v,Math.max(0,(gap-2.2)*.54))*(angularError(h,heading)>.55?.42:1);
    const result=sweepVehicle(p,unit.root.rotation.y,heading,-Math.sin(heading)*rate*dt,-Math.cos(heading)*rate*dt,(x,z,y)=>blockedVehicle(unit,x,z,y));
    unit.root.rotation.y=result.yaw;unit.update(dt,result.hit?0:rate,0);
  }
  const closestRoad=(n,roads)=>roads.reduce((a,b)=>Math.abs(n-a)<Math.abs(n-b)?a:b);
  function updateWanted(dt,p){
    const ep=enforcer.root.position,floor=getaway>=0&&getaway<8?2:getaway>=0&&getaway<12?1:0;
    const seen=pursuitActive&&dist(ep.x,ep.z,p)<29&&clearStreetLine(ep,p)||floor>0;
    wanted=wantedStep(wanted,dt,{incident,seen,floor});incident=0;
    const star=starsFor(wanted.heat),readout=$('#heat');readout.hidden=star===0;if(star!==+readout.dataset.stars){readout.dataset.stars=String(star);readout.querySelector('span').textContent='★'.repeat(star)+'☆'.repeat(5-star);readout.querySelector('small').textContent=seen?'EM VISTA':'PROCURA';}
    if(star>0&&getaway<0&&!disguise&&!pickup&&!onJet){
      heatPump+=dt;
      if(!pursuitActive&&heatPump>4.5){
        heatPump=0;
        for(const step of [39,-42,61,-70]){const x=closestRoad(p.x,XS)-3.2,z=clamp(p.z+step,ZS[0]+8,ZS.at(-1)-8);if(!blockedVehicle(enforcer,x,z,0)){ep.set(x,.095,z);pursuitActive=true;break;}}
      }
      if(pursuitActive){
        const fi=closestRoad(p.x,XS),fz=closestRoad(p.z,ZS);
        const sameCorridor=Math.abs(ep.x-p.x)<6.5||Math.abs(ep.z-p.z)<6.5;
        const route=urbanRoute(ep,{x:fi,z:fz}).slice(1);const way=sameCorridor&&clearStreetLine(ep,p)?p:route.find(q=>dist(ep.x,ep.z,q)>7)||p;
        chaseCar(enforcer,way,Math.min(16,8+star*1.5),dt);beaconTop.intensity=2.8+5*Math.sin(elapsed*7)**2;
        if(dist(ep.x,ep.z,p)>178){pursuitActive=false;enforcer.root.visible=false;heatPump=0;}
      }
    }else {pursuitActive=false;beaconTop.intensity=0;heatPump=0;}
    enforcer.root.visible=pursuitActive;
  }
  function rollIntro(vehicle,dt){
    const p=vehicle.root.position,v=p.z>132.5?3.9:0;
    sweepVehicle(p,0,0,0,-v*dt,(x,z,y)=>blockedVehicle(vehicle,x,z,y));vehicle.update(dt,v,0);radio.motor(v,true);
    if(tailCar){const t=tailCar.root.position;const speed=cut?.i>=3?6.3:3.2;if(t.z>p.z+9)sweepVehicle(t,0,0,0,-speed*dt,(x,z,h)=>blockedVehicle(tailCar,x,z,h));tailCar.update(dt,speed,0);}
  }
  function renderMiragemGuide(){
    const marker=$('.miragem-direction'),room=$('.miragem-location'),nav=heist?.direction;
    const active=Boolean(nav&&!wheel.isOpen());marker.hidden=room.hidden=!active;
    if(!active)return;
    const {x,y,angle,meters,area,near,behind}=nav;
    marker.style.setProperty('--cue-x',`${x*100}%`);marker.style.setProperty('--cue-y',`${y*100}%`);marker.style.setProperty('--cue-turn',`${angle}deg`);
    marker.classList.toggle('turn',behind);marker.classList.toggle('ready',near);
    marker.querySelector('b').textContent=near?(heist.phase==='escape'?'TERRAÇO':'INTERAGIR'):behind?'VIRE / '+meters+' m':`${meters} m`;
    if(room.textContent!==area)room.textContent=area;
  }
  function frame(now){
    if(!alive)return;raf=requestAnimationFrame(frame);const frameGap=(now-last)/1000,realDt=clamp(frameGap,.001,.235);last=now;lockHint();if(paused||mapOpen||guideOpen||radioOpen||puzzle)return;if(wardrobeOpen){player.animate(realDt,0);camera(realDt);renderer.render(scene,cam);return;}const dt=realDt*(wheel.isOpen()?WHEEL_RATE:1);elapsed+=dt;
    if(film.active){const shot=film.frame(clamp(frameGap,.001,.75),cam.aspect);world.sky.position.copy((shot||cam).position);world.tide(elapsed);renderer.render(scene,shot||cam);return;}
    if(navSwitch){switchFrame(realDt);renderer.render(scene,cam);return;}
    if(!cut){cinema.restore(realDt);clockSkip=smooth(clockSkip,clockSkipGoal,1.1,realDt);world.daylight(elapsed+clockSkip);}
    if(heist&&!cut){
      const keysHeld={forward:axis(['KeyW','ArrowUp'],['KeyS','ArrowDown'],-touch.y),side:axis(['KeyD','ArrowRight'],['KeyA','ArrowLeft'],touch.x),yaw:viewYaw,elevation,voice:speech.level(),hold:tool===1?'pulse':tool===2?'torch':null,voiceName:$('.ride-caption').hidden?null:$('.ride-caption small').textContent,crouch:keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.run};
      heist.update(dt,keysHeld,cam);if(heist){heistAudio.update(heist.phase,heist.noticed,heist.canopy);host.classList.toggle('escape-pressure',heist.phase==='escape'||heist.phase==='air'&&!heist.canopy);$('.casino-title').hidden=!heist.title;$('.casino-tip i b').style.width=`${heist.noticed*100}%`;$('#touch-tool').hidden=heist.phase!=='escape';host.dataset.heist=heist.phase;if(heist.shot)host.dataset.miragemShot=heist.shot;else delete host.dataset.miragemShot;renderMiragemGuide();const logo=$('.miragem-logo');if(heist.titleBeat&&logo.hidden)titleCue.play();logo.hidden=!heist.titleBeat;}
      world.sky.position.copy(cam.position);world.tide(elapsed);if(!heist?.title)renderer.render(scene,cam);return;}

    if(cut){if(cut.place==='casino')heistAudio.update('alarm');cut.age+=realDt;if(cut.age>3.8)$('.scene-location').hidden=true;if(cut.ride)rollIntro(cut.ride,realDt);host.dataset.shot=cinema.frame(realDt,cam,speech.level());world.sky.position.copy(cam.position);world.tide(elapsed);renderer.render(scene,cam);return;}
    const p=onJet?jet.root.position:car?.root.position||player.root.position;
    {
      const forward=axis(['KeyW','ArrowUp'],['KeyS','ArrowDown'],-touch.y), side=axis(['KeyD','ArrowRight'],['KeyA','ArrowLeft'],touch.x), running=keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.run;
      if(onJet){
        const next=jetStep(p,jet.root.rotation.y,jetSpeed,forward,side,keys.has('Space')||touch.run,dt);
        p.x=next.x;p.z=next.z;jet.root.rotation.y=next.yaw;jetSpeed=next.speed;jet.update(dt,jetSpeed,-side,elapsed);
        player.root.position.set(p.x+Math.sin(next.yaw)*.23,p.y+jet.riderHeight,p.z+Math.cos(next.yaw)*.23);player.root.rotation.y=next.yaw;player.root.rotation.z=jet.lean*.52;player.animate(dt,0,0,{jet:true,pitch:.09,steer:jet.steer,grips:jet.grips()});
        if(freeCamera<=0)viewYaw=turn(viewYaw,next.yaw,4.2,dt);radio.motor(Math.abs(jetSpeed)*.74,true);
      }else if(car){
        const next=driveStep(p,yaw,speed,driving,{throttle:forward,side,brake:keys.has('Space')||touch.run,sand:p.x>228},dt,(x,z,h)=>blockedVehicle(car,x,z,h));
        yaw=next.yaw;speed=next.speed;driving=next;
        if(elapsed-lastCollision>.32&&next.impact>1.65){sfx('bump');lastCollision=elapsed;hitFx=Math.min(.8,next.impact*.05);}
        car.root.rotation.y=yaw;car.update(dt,speed,-next.steer,next.impact);
        if(world.looseProps(dt,p,speed,yaw)&&elapsed-lastCollision>.15){sfx('rattle');lastCollision=elapsed;}
        if(freeCamera<=0&&Math.abs(speed)>1.5&&!wheel.isOpen())viewYaw=turn(viewYaw,yaw,3.7,dt);radio.motor(Math.abs(speed),true,next.rpm,Math.max(0,forward));
        if(getaway>=0){
          const current=getawayRoute[getaway],nextStep=advanceGetaway(getaway,{distance:dist(p.x,p.z,current),speed,inCar:true});
          driveAge+=dt;const card=$('.prologue-credits'),cue=Math.floor(driveAge/7.5);
          card.hidden=cue>=credits.length||driveAge%7.5>5.4;
          if(cue!==creditBeat&&cue<credits.length){creditBeat=cue;card.classList.remove('reveal');card.querySelector('span').textContent=credits[cue][0]+' · CRÉDITOS FICTÍCIOS';card.querySelector('b').textContent=credits[cue][1];void card.offsetWidth;card.classList.add('reveal');}
          if(nextStep!==getaway){getaway=nextStep;refresh();sfx('select');if(getaway===8)rideTalk(1);if(getawayRoute[getaway].kind==='exit')rideTalk(2);}
          if(tailCar&&getaway<8){
            const tp=tailCar.root.position,step=getawayRoute[tailGuide];if(tailGuide<getaway&&dist(tp.x,tp.z,step)<7.6)tailGuide++;
            chaseCar(tailCar,getawayRoute[tailGuide],Math.min(17,9.5+getaway*.88),dt);
          }else if(tailCar&&getaway===8)chaseCar(tailCar,{x:-126,z:118},11.2,dt);

        }
      }else{
        const mag=Math.min(1,Math.hypot(forward,side)),max=running?5.9:2.95;
        const heading=viewYaw+Math.atan2(-side,forward);
        if(!swimming&&p.x>=shore.enter&&!vault&&!pickup){swimming=true;footHeight=jumpVelocity=walk=0;host.classList.add('swimming');sfx('splash');toast('Nadando','Vá em direção à areia para sair da água.');}
        if(swimming){
          const next=swimStep(p,heading,mag,dt);p.x=next.x;p.z=next.z;p.y=smooth(p.y,mag>.08?-.60:-1.36,8,dt)+Math.sin(elapsed*5.6)*.012;
          if(mag>.04)player.root.rotation.y=turn(player.root.rotation.y,heading,6,dt);
          player.root.rotation.x=smooth(player.root.rotation.x,mag>.08?-1.12:0,5,dt);
          player.animate(dt,mag,0,{swim:true});
          if(p.x<=shore.exit+.004){swimming=false;host.classList.remove('swimming');p.y=.12;player.root.rotation.x=0;}
        }else if(vault){
          const v=vault;v.t=Math.min(v.duration,v.t+dt);const q=v.t/v.duration,u=T.MathUtils.smoothstep(q,0,1);
          p.x=T.MathUtils.lerp(v.x,v.to.x,u);p.z=T.MathUtils.lerp(v.z,v.to.z,u);p.y=.12+Math.sin(Math.PI*q)**1.18*v.to.height;
          const weight=T.MathUtils.smootherstep(q,.13,.32)*(1-T.MathUtils.smootherstep(q,.46,.69));
          player.animate(dt,0,0,weight>.01?{vaultSupport:v.support,contactWeight:weight}:null);if(q>=1){vault=null;player.land?.();sfx('step');}
        }else{
          walk=smooth(walk,mag*max,mag?8:16,dt);let distance=0;
          if(mag>.025){player.root.rotation.y=turn(player.root.rotation.y,heading,13,dt);distance=moveFoot(p,-Math.sin(heading)*walk*dt,-Math.cos(heading)*walk*dt,.31);}
          if(footHeight>0||jumpVelocity>0){jumpVelocity-=15.6*dt;footHeight=Math.max(0,footHeight+jumpVelocity*dt);if(footHeight===0){jumpVelocity=0;player.land?.();sfx('step');}}
          p.y=.12+footHeight;player.root.rotation.x=smooth(player.root.rotation.x,0,10,dt);player.root.rotation.z=smooth(player.root.rotation.z,0,10,dt);
          const actual=distance/Math.max(.006,dt),hold=tool===2&&torch.intensity?'torch':tool===1?'pulse':null;
          player.animate(dt,clamp(actual/2.7,0,1),running?clamp((actual-2)/3,0,1):0,{air:footHeight>.03,hold});
          if(actual>1.1){step+=distance;if(step>(running?1.62:1.19)){step=0;sfx(p.x>227?'sand':'step');}}else step=0;
        }
        host.classList.toggle('in-air',!!vault||footHeight>.022);radio.motor(0,false);

      }
      if(activeActivity){
        const a=activeActivity;
        if(a.time && (timer-=dt)<=0){activeActivity=null;refresh();toast('Tempo esgotado','Volte ao ponto verde para tentar de novo.');}
        else if(car&&target&&((a.kind==='drive'&&dist(p.x,p.z,target)<6)||(a.kind==='park'&&canStopInBay(p,speed,target))))nextJob();
      }else if(car&&!tracked&&getaway<0){const step=currentStep();if(step?.kind==='drive'&&dist(p.x,p.z,step)<8){if(storyLeg<(step.via?.length||0)){storyLeg++;sfx('select');refresh();}else{storyLeg=0;nextStory();}}else if(step?.kind==='park'&&canStopInBay(p,speed,step))nextStory();}
    }
    if(pickup&&escapeMate.root.visible){const q=escapeMate.root.position,h=directionTo(q,p),gap=dist(q.x,q.z,p),v=Math.min(3.25,(gap-1.04)*1.85);if(v>0){moveFoot(q,-Math.sin(h)*v*dt,-Math.cos(h)*v*dt,.26,null);escapeMate.root.rotation.y=turn(escapeMate.root.rotation.y,h,7,dt);}escapeMate.animate(dt,Math.max(0,v/3.6));}
    else if(getaway>=0&&car&&escapeMate.root.visible)escapeMate.animate(dt,0,0,{crouch:true,pitch:.09});
    for(const [i,ripple] of ripples.entries()){
      ripple.visible=swimming;if(!swimming)continue;
      const progress=(elapsed*1.41+i*.34)%1,dir=player.root.rotation.y;
      ripple.position.set(p.x-Math.sin(dir)*.70,-.195+i*.0003,p.z-Math.cos(dir)*.70);
      ripple.scale.setScalar(.16+progress*.94);ripple.material.opacity=(1-progress)*.32;
    }
    if(!car)world.looseProps(dt,null,0,0);if(!onJet)jet.update(dt,0,0,elapsed);discharge=Math.max(0,discharge-dt);lineBurst.visible=discharge>0;
    torch.position.set(p.x-Math.sin(viewYaw)*1.65,p.y+1.41,p.z-Math.cos(viewYaw)*1.65);
    if(!car&&!onJet&&!pickup&&!disguise&&getaway<0&&!wheel.isOpen()&&elapsed-lastStreetVoice>28&&walk>.65){
      const here=people.filter(n=>n.p.root.visible&&n.p.root.position.distanceTo(p)<5.9&&clearStreetLine(p,n.p.root.position)).sort((a,b)=>a.p.root.position.distanceTo(p)-b.p.root.position.distanceTo(p))[0];
      if(here)sayStreet(here,'orla');
    }
    if(car&&getaway<0&&elapsed-lastStreetVoice>18&&driving.impact>3.5)sayStreet(people.find(n=>n.p.root.visible&&n.p.root.position.distanceTo(p)<7),'transito');

    freeCamera=Math.max(0,freeCamera-dt);
    for(const c of cars){
      if(!c.patrol)continue;const p=c.root.position;if(dist(p.x,p.z,c.patrol[c.index])<1.5)c.index=(c.index+1)%c.patrol.length;
      const a=c.patrol[c.index],h=directionTo(p,a),heading=turn(c.root.rotation.y,h,5.3,dt);
      const nearAngle=angularError(heading,h),wanted=nearAngle>.55?c.rate*.4:c.rate;
      const result=sweepVehicle(p,c.root.rotation.y,heading,-Math.sin(heading)*wanted*dt,-Math.cos(heading)*wanted*dt,(x,z,y)=>blockedVehicle(c,x,z,y,true));
      c.root.rotation.y=result.yaw;c.update(dt,result.hit?0:wanted,0);
    }
    const focal=(onJet?jet.root:car?.root||player.root).position;
    if(streetTalker)speech.range(voiceDistance(p.distanceTo(streetTalker.p.root.position)));
    const {hours,light}=cityClock(elapsed+clockSkip,mode===2);
    const late=hours>=19.5||hours<3.4, beachTime=hours>=7.1&&hours<14.3;
    const candidates=people.filter(n=>dist(n.x,n.z,focal)<87&&(!n.type||n.type==='night'&&late||n.type==='beach'&&beachTime||n.type==='morning'&&light>.58)).sort((a,b)=>dist(a.x,a.z,focal)-dist(b.x,b.z,focal));
    const visibleNow=new Set(candidates.slice(0,quality==='high'?25:16));
    for(const c of cars)c.root.visible=(c!==tailCar||getaway>=0&&getaway<9)&&dist(c.root.position.x,c.root.position.z,focal)<185;
    for(const n of people){
      const q=n.p.root.position,close=dist(q.x,q.z,focal)<46;const angle=Math.abs(angularError(viewYaw,directionTo(focal,q)));const inSight=close&&angle<1.11&&clearStreetLine(focal,q);
      const drawn=close&&n.p.root.parent?true:visibleNow.has(n)&&(!inSight||!n.wasEvaluated);n.wasEvaluated=true;if(drawn&&!n.p.root.parent)scene.add(n.p.root);else if(!drawn&&n.p.root.parent)n.p.root.removeFromParent();n.p.root.visible=drawn;if(!drawn)continue;
      n.t+=dt*.52;const p=n.p.root.position,near=dist(p.x,p.z,focal),panic=!!car&&Math.abs(speed)>3.2&&near<7&&clearStreetLine(p,focal);
      if(panic)n.avoid=Math.max(n.avoid||0,2.8);n.avoid=Math.max(0,(n.avoid||0)-dt);n.flinch=Math.max(0,(n.flinch||0)-dt);
      if(car&&near<1.45&&Math.abs(speed)>3.2&&elapsed-(n.impact||-20)>3.3){n.impact=elapsed;n.flinch=.8;n.avoid=5.8;incident+=1.25;sfx('bump');}
      let dx=0,dz=0;
      if(n.avoid>0){const a=Math.atan2(p.x-focal.x,p.z-focal.z);dx=Math.sin(a)*3.2*dt;dz=Math.cos(a)*3.2*dt;if(world.collides(p.x+Math.sin(a)*.7,p.z+Math.cos(a)*.7,.29)){dx=Math.cos(a)*1.9*dt;dz=-Math.sin(a)*1.9*dt;}}
      else if(near<1.25&&!car){dx=(p.x-focal.x)*dt*.57;dz=(p.z-focal.z)*dt*.57;}
      else if(near>2.7){dx=clamp((n.x+Math.sin(n.t*.59)*Math.min(n.w,2)-p.x)*dt,-1.7*dt,1.7*dt);dz=clamp((n.z+Math.sin(n.t)*n.w-p.z)*dt,-1.68*dt,1.68*dt);}
      const moved=moveFoot(p,dx,dz,.28,n);
      const lean=n.flinch>0?Math.sin(n.flinch*4.9)*.29:0;n.p.root.rotation.z=smooth(n.p.root.rotation.z,lean,7,dt);
      if(moved>.002)n.p.root.rotation.y=turn(n.p.root.rotation.y,Math.atan2(-dx,-dz),7,dt);
      else if(near<3.2)n.p.root.rotation.y=turn(n.p.root.rotation.y,Math.atan2(p.x-focal.x,p.z-focal.z),4.3,dt);
      n.p.animate(dt,clamp(moved/(dt*3),0,1),n.avoid>0?.56:0,{speaking:streetTalker===n,gesture:streetTalker===n,voice:streetTalker===n?speech.level():0,mood:n.avoid>0?'fear':'cold',hurt:Math.min(1,(n.flinch||0)*2),look:near<3.2?.32:0});
    }
    if(lead!=='Davi'){
      const q=davi.root.position,atKiosk=currentStep()?.label==='Falar com Davi';
      davi.root.visible=mode===0&&!pickup&&!disguise&&getaway<0&&(atKiosk&&dist(q.x,q.z,currentStep())<8||meetup&&dist(q.x,q.z,focal)<58);
      if(davi.root.visible){
        if(meetup&&!meetup.leave&&elapsed>meetup.started+10)meetup.leave=true;
        let stride=0;
        if(meetup?.leave){
          const path=[{x:217,z:38.3},{x:229.4,z:38.3},{x:234,z:48}],mark=path[meetup.leg],gap=dist(q.x,q.z,mark);
          if(gap<.48&&meetup.leg<path.length-1)meetup.leg++;
          if(gap>.42){const heading=directionTo(q,mark);stride=moveFoot(q,-Math.sin(heading)*dt*1.75,-Math.cos(heading)*dt*1.75,.29)/(dt*2.8);davi.root.rotation.y=turn(davi.root.rotation.y,heading,5,dt);}
        }
        const speaking=!!meetup&&!meetup.leave&&!$('.ride-caption').hidden;
        davi.animate(dt,stride,0,{scene:speaking,gesture:speaking,speaking,voice:speech.level()});
      }
    }
    if(nara.root.visible&&nara.root.position.distanceTo(focal)<28)nara.animate(dt,0);
    updateWanted(dt,focal);
    for(const {actor,shadow} of shadows){shadow.visible=actor.visible;if(!shadow.visible||swimming&&actor===player.root){shadow.visible=false;continue;}const p=actor.position;shadow.position.set(p.x, p.x>212?.131:.047,p.z);shadow.rotation.z=actor.rotation.y;}
    points.forEach((m,i)=>{m.visible=!cut&&(!activeActivity||sideJobs[i].id!==activeActivity.id);});
    if(vinyl.visible){vinyl.rotation.set(.4,elapsed*1.3,.6);vinyl.position.y=.64+Math.sin(elapsed*3.)*.12;}
    if(target){pointer.position.y=2.45+Math.sin(elapsed*2.5)*.34;pointer.rotation.y+=dt*.85;marker.scale.setScalar(1+Math.sin(elapsed*2.5)*.08);}
    if(hitFx>0){hitFx=Math.max(0,hitFx-realDt*2.3);$('.screen-impact').style.opacity=String(hitFx);}
    if(elapsed>toasts)$('.toast').hidden=true;
    if(elapsed>mapTick){host.dataset.movement=onJet?'jet':swimming?'swim':vault?'vault':footHeight>.03?'jump':'ground';if(devTools)host.dataset.coords=`${p.x.toFixed(2)},${p.z.toFixed(2)}`;else delete host.dataset.coords;$('#hud-switch').hidden=daviReserved()||pickup||getaway>=0||disguise||!!onJet||!!car;world.lod(p.x,p.z,false);mapTick=elapsed+.105;const bearing=Math.round(-viewYaw*4/Math.PI);$('#nav-distance').hidden=!waypoint;if(waypoint)$('#nav-distance').textContent=`GPS · ${Math.round(dist(p.x,p.z,waypoint))} M`;$('#compass').textContent=['N','NE','L','SE','S','SO','O','NO'][(bearing%8+8)%8];context=cut||wheel.isOpen()?null:nearest();const it=$('.interact');if(context&&(!car||Math.abs(speed)<5)){it.hidden=false;const label=context.text;if(it.dataset.label!==label){it.dataset.label=label;it.innerHTML=`<kbd>E</kbd><span>${label}</span>`;}}else it.hidden=true;
      $('#touch-tool').hidden=!!car||onJet;const dial=speedometer(onJet?jetSpeed:speed);$('.drive').hidden=!car&&!onJet;$('#speed').textContent=dial.text;$('#gear').textContent=dial.reverse?'R':onJet?'ÁGUA':String(driving.gear||1);$('.drive').style.setProperty('--speed',String(dial.progress));
      const nav=waypoint||target,beacon=$('#route-beacon');beacon.hidden=!nav||wheel.isOpen()||Boolean(context&&!car);beacon.classList.toggle('user-pin',Boolean(waypoint));
      if(nav&&!beacon.hidden){const d=hudDirection(viewYaw,p,nav);beacon.style.setProperty('--angle',`${d.degrees}deg`);beacon.querySelector('b').textContent=waypoint?'GPS':getaway>=0?'FUGA':'DESTINO';beacon.querySelector('small').textContent=shortDistance(d.distance);}

      $('.mission').style.setProperty('--route',String(getaway>=0?(getaway+1)/getawayRoute.length:(storyStep+1)/(campaign[stage]?.steps.length||1)));
      if(target)$('#objective').dataset.distance=`${Math.round(dist(p.x,p.z,target))} M`;else delete $('#objective').dataset.distance;
      const area=districts.reduce((a,b)=>dist(p.x,p.z,a)<dist(p.x,p.z,b)?a:b);$('#minidistrict').textContent=area.name.toUpperCase();
      $('#mode-label').textContent=activeActivity?.time?`TEMPO · ${Math.ceil(timer)} s`:activeActivity?'ATIVIDADE OPCIONAL':`${MODE_LABEL[mode]} · ${cityClock(elapsed+clockSkip,mode===2).time}`;drawings($('.minimap canvas'),false);
    }
    world.tide(elapsed);radio.ambient(clamp((p.x-183)/60,0,1),elapsed);camera(dt);renderer.render(scene,cam);
  }
  refresh(); radio.start(mode===2?4:0);
  if(newGetaway&&openingCar){radio.choose(radio.stations.length-1);setupHeist();}
  if(cut){cinema.frame(.02,cam,0);world.sky.position.copy(cam.position);}else if(!heist){world.lod(spawn.x,spawn.z,false);camera(.02,true);}renderer.render(scene,cam);raf=requestAnimationFrame(frame);
  return {openMap(){map(true);},settings,resumeFromClick(){this.pause(false);if(restoreLock)requestMouse();restoreLock=false;},pause(v){if(paused===v)return;paused=v;clearInput();if(v){restoreLock=document.pointerLockElement===cv;wheel.close(false);releaseMouse();}radio.pause(v);heistAudio.pause(v);pauseRide(v);if(v&&cut){cancelDialogue();$('.line-track').getAnimations().forEach(a=>a.pause());}else if(!v&&cut)dialogue(true);},destroy(){alive=false;film.destroy();clearRideTalk();speech.pause(false);wheel.close(false);releaseMouse();luzia.disposeOutfits?.();daviPlayer.disposeOutfits?.();cinema.dispose();heistAudio.stop();titleCue.stop();cancelAnimationFrame(raf);events.forEach(fn=>fn());cancelDialogue();radio.stop();const geometries=new Set(),materials=new Set(),textures=new Set();for(const n of people)if(!n.p.root.parent)scene.add(n.p.root);scene.traverse(o=>{if(o.geometry){geometries.add(o.geometry);if(o.isInstancedMesh)o.dispose();}if(o.material){materials.add(o.material);if(o.material.map)textures.add(o.material.map);} });miragemMap?.dispose();textures.forEach(t=>{if(t!==miragemMap)t.dispose();});materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();host.replaceChildren();host.className='';}};
}
