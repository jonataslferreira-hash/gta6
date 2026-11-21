import * as T from 'three';
import { person } from './actors.js';
import { castStyles } from './cinematics.js';
import { casinoSite, casinoLoot, annexSteps, chuteWait, dropLine } from './miragem.js';
import { openingDolly, openingSeconds, indoorRoute } from './miragem-direction.js';
export { casinoSite, casinoLoot };
const clamp=T.MathUtils.clamp;
const lerp=T.MathUtils.lerp;
export function glideStep(y,velocity,open,dt){
  const v=open?Math.max(-3.9,velocity+(-3.9-velocity)*(1-Math.exp(-11*dt))):Math.max(-18.6,velocity-13.5*dt);
  return {y:y+v*dt,velocity:v};
}
export function makeHeist(scene,{runner,ally=person(castStyles.Davi),makeGuard=null,announce,onAlarm,onDrop,onLand,onArrival=done=>done(),canLand=()=>true,onSearch=()=>{}, selectHint,effect=()=>{}}){
  const root=new T.Group();root.position.set(casinoSite.x,casinoSite.y,casinoSite.z);scene.add(root);
  const solid=[];const cache=new Map();
  const material=(c,g=false)=>{const key=c+g;if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color:c,roughness:g?.45:.77,metalness:g?.27:.027,emissive:g?c:0,emissiveIntensity:g?.24:0}));return cache.get(key);};
  const boxGeo=new T.BoxGeometry();
  function box(x,y,z,w,h,d,c,{glow=false,wall=false,yaw=0}={}){const m=new T.Mesh(boxGeo,material(c,glow));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=yaw;m.castShadow=false;m.receiveShadow=true;root.add(m);if(wall)solid.push({x,z,w,d,top:y+h/2});return m;}
  box(0,-.38,19.1,13,.75,24,'#58444e');box(0,-.40,0,15,.76,24.5,'#67516a');
  box(0,-.034,3.95,12,.068,15.3,'#49394f');
  for(let i=-5;i<=5;i++)for(let j=-7;j<=8;j++)if((i+j)%2===0)box(i*1.06,.009,j*.87+2.3,1.03,.021,.85,'#594354');
  box(0,.026,5.2,3,.026,13.3,'#7e445f');
  for(const x of [-6.1,6.1]){
    box(x,1.4,1.15,.32,2.85,18.2,'#33273e',{wall:true});
    box(x,1.25,-10.6,.25,2.42,4.15,'#61566a',{wall:true});
    for(let z=-6;z<11;z+=2.6){box(x*.974,1.49,z,.12,2.22,.16,'#a46d78');box(x*.946,2.44,z,.067,.055,1.7,'#eda3a9',{glow:true});}
    for(let z=-7;z<12;z+=4.5){box(x,-3.6,z,.18,4.1,1.3,'#877990');box(x,-3.52,z,.2,3.7,1.12,'#55466a');}
  }
  for(const x of [-4.8,2.1])box(x,1.44,10.9,x<0?2.8:5.2,2.9,.24,'#554052',{wall:true});
  // Real back-of-house rooms: the panel and manifest are reached through different lanes.
  box(0,1.38,30.5,12.2,2.76,.34,'#3b3345',{wall:true});
  for(const x of [-6.1,6.1])box(x,1.39,20.7,.30,2.78,19.70,'#483948',{wall:true});
  box(0,2.91,20.27,12.32,.22,20.2,'#332733');
  for(const [x,z,w,d] of [[.30,15.8,7.2,2.1],[-2.13,22.2,7.48,2.4],[3.55,26.2,4.4,1.5],[1.4,29,3.3,1.22]]){
    box(x,.83,z,w,1.64,d,'#514555',{wall:true});box(x,1.69,z,w+.07,.10,d+.07,'#7b6b73');
    for(let i=0;i<Math.floor(w/.68);i++)box(x-w*.5+.36+i*.68,1.08,z+d*.502,.50,.031,.028,'#bdab91');
    const face=z-d*.5-.013;
    box(x,1.30,face,w-.08,.61,.031,'#355356');
    box(x,.96,face-.019,w-.08,.035,.026,'#ca916a',{glow:true});
    box(x,.18,face,w-.08,.25,.033,'#3f3445');
    for(let i=0;i<Math.floor(w/.29);i++)box(x-w*.5+.21+i*.29,1.31,face-.023,.025,.55,.035,'#6e8c80');
  }
  for(let z=13;z<31;z+=3.4){
    box(0,.004,z,11.9,.021,3.32,z%2>.5?'#51495a':'#474150');
    box(0,2.78,z,6.5,.055,.057,'#edc9a7',{glow:true});
    for(const x of [-5.48,5.48])box(x,2.81,z,.06,.061,3.34,'#8dbdb9',{glow:true});
    for(const x of [-5.92,5.92])box(x,1.19,z,.052,.058,.54,'#d3afa0',{glow:true});
  }
  for(const [x,z,c] of [[4.53,12.2,'#9da993'],[-4.45,28.3,'#d5a966'],[4.25,5.3,'#b98284']]){
    box(x,.86,z,.74,1.55,.49,'#454052');box(x,.99,z+.25,.40,.57,.025,'#6f6576');box(x,1.12,z+.272,.18,.086,.023,c,{glow:true});
    box(x,.84,z+.265,.22,.032,.046,'#2b2633');box(x+.16,.93,z+.268,.036,.14,.049,'#c6a68a');
    for(const k of [-1,1]){box(x+k*.368,.787,z,.043,1.58,.53,'#756676');box(x+k*.306,.15,z+.16,.096,.13,.17,'#2e2634');}
    for(let i=0;i<4;i++)box(x-.114+i*.071,.65,z+.267,.049,.021,.013,i===2?c:'#382f42',{glow:i===2});
  }

  for(const z of [2.6,8.5]){
    const shade=new T.Mesh(new T.TorusGeometry(.79,.038,7,32),material('#e3aa8a',true));shade.rotation.x=-Math.PI/2;shade.position.set(0,2.77,z);root.add(shade);
    for(const x of [-.65,.65])box(x,2.83,z,.028,.35,.027,'#c49885');
  }
  if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=512;c.height=110;const ctx=c.getContext('2d');ctx.fillStyle='#251728';ctx.fillRect(0,0,512,110);ctx.strokeStyle='#bc826e';ctx.lineWidth=3;ctx.strokeRect(7,8,498,94);ctx.font='italic bold 52px Georgia';ctx.textAlign='center';ctx.fillStyle='#f3c1ab';ctx.fillText('MIRAGEM',256,68);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(4.5,1.0),new T.MeshBasicMaterial({map}));sign.position.set(-5.90,1.84,.8);sign.rotation.y=Math.PI/2;root.add(sign);
    const service=document.createElement('canvas');service.width=512;service.height=128;
    const g=service.getContext('2d');g.fillStyle='#25383d';g.fillRect(0,0,512,128);
    g.strokeStyle='#b38f71';g.lineWidth=4;g.strokeRect(8,8,496,112);
    g.fillStyle='#f5dcb7';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText('ÁREA DE SERVIÇO',256,57);
    g.fillStyle='#c7ddd4';g.font='21px monospace';g.fillText('MIRAGEM   /   38º ANDAR',256,94);
    const label=new T.CanvasTexture(service);label.colorSpace=T.SRGBColorSpace;
    const staff=new T.Mesh(new T.PlaneGeometry(1.73,.4325),new T.MeshBasicMaterial({map:label}));staff.position.set(-1.55,2.44,15.18);staff.rotation.y=Math.PI;root.add(staff);
    for(const x of [-2.15,-.95])box(x,2.75,15.19,.028,.196,.028,'#ceae8d');
    for(const [x,y,z,text] of [[4.53,1.44,12.47,'PLANTA'],[-4.45,1.44,28.57,'SENSOR'],[4.25,1.44,5.57,'LISTA']]){
      const paper=document.createElement('canvas');paper.width=256;paper.height=72;const pen=paper.getContext('2d');
      pen.fillStyle='#392b33';pen.fillRect(0,0,256,72);pen.fillStyle='#fff0cc';pen.font='bold 42px monospace';pen.textAlign='center';pen.fillText(text,128,51);
      const sticker=new T.CanvasTexture(paper);sticker.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(.58,.16),new T.MeshBasicMaterial({map:sticker,side:T.DoubleSide}));sign.position.set(x,y,z);root.add(sign);
    }
  }

  for(const x of [-4.56,4.56])box(x,1.38,-7.3,3.1,2.71,.36,'#48324d',{wall:true});
  box(0,2.66,-7.3,6.3,.22,.54,'#795269');
  for(const z of [-5,0,5,9])box(0,2.76,z,11.95,.17,.30,'#957785');
  for(const x of [-3.6,3.6])for(const z of [3.8,7.2]){
    box(x,.46,z,2,.91,1.19,'#513941',{wall:true});box(x,.96,z,2.1,.10,1.24,'#927071');box(x,1.025,z,1.91,.035,1.08,'#476b63');
    for(let n=0;n<6;n++)box(x+.69-n*.21,1.059,z+(n%2)*.135,.12,.045,.095,n%3===0?'#eba879':'#a5c7b8');
  }
  for(let n=0;n<5;n++){const z=-4.8+n*.81;box(4.88,.91,z,.86,1.8,.69,'#583e63',{wall:true});box(4.46,1.25,z,.04,.53,.56,n%2===0?'#93bbad':'#e39eaa',{glow:true});box(4.39,.87,z,.20,.12,.56,'#45334d');}
  box(casinoLoot.x,.46,casinoLoot.z,1.34,.93,.80,'#3f3047',{wall:true});box(casinoLoot.x,.95,casinoLoot.z,1.45,.09,.88,'#a17a80');
  const bag=new T.Group();bag.position.set(casinoLoot.x,1.12,casinoLoot.z);root.add(bag);
  const bagPart=(x,y,z,w,h,d,color)=>{const m=new T.Mesh(boxGeo,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);bag.add(m);};
  bagPart(0,0,0,.56,.28,.36,'#754350');bagPart(0,.080,0,.567,.028,.369,'#343144');
  bagPart(0,-.139,0,.545,.036,.357,'#483544');
  for(const x of [-.203,.203]){bagPart(x,0,.181,.037,.267,.021,'#bb8b6a');bagPart(x,.133,0,.04,.025,.37,'#a46c57');}
  bagPart(0,.151,.048,.168,.043,.058,'#2f2531');for(const x of [-.073,.073])bagPart(x,.108,.048,.026,.073,.042,'#2f2531');
  const clasp=box(casinoLoot.x,1.15,casinoLoot.z+.19,.13,.061,.027,'#ffba8e',{glow:true});
  for(const x of [-4.6,4.6]){box(x,.42,-11.95,3.04,.85,.24,'#6f5a74',{wall:true});box(x,.86,-11.95,3.09,.09,.33,'#b994a9');}
  for(const x of [-1.10,1.10])box(x,.025,-11.3,.16,.048,1.8,'#9fcdb9',{glow:true});
  box(0,2.98,1.95,12.35,.24,18.9,'#38292b');
  for(const x of [-2.23,2.23]){
    box(x,1.22,-7.3,1.63,2.44,.25,'#5a414b',{wall:true});
    box(x,1.58,-7.14,1.49,1.48,.08,'#886665');
    for(const d of [-.65,-.50,0,.50,.65])box(x+d,1.59,-7.08,.024,1.52,.03,'#d7a579');
  }
  const door=new T.Group();root.add(door);
  const doorPart=(...args)=>{const m=box(...args);door.add(m);return m;};
  for(const x of [-.64,.64]){
    doorPart(x,1.22,-7.3,1.26,2.44,.20,'#593d46');
    doorPart(x,1.52,-7.18,1.09,1.51,.08,'#342c39');
    for(const d of [-.54,.54])doorPart(x+d,1.52,-7.11,.042,1.55,.042,'#a4896a');
    for(let n=0;n<7;n++)doorPart(x,1.1+n*.16,-7.117,1.1,.019,.041,'#8d7260');
  }
  doorPart(0,.91,-7.08,.26,.08,.14,'#b68558');
  doorPart(.21,1.06,-7.07,.14,.13,.05,'#482d36');
  doorPart(.21,1.082,-7.036,.081,.037,.018,'#e05c59',{glow:true});
  // Bronze screen and warm cove lights give the emergency lighting something to play against.
  for(const x of [-5.7,5.7])for(let z=-6;z<11;z+=2.6){
    for(const d of [-.46,-.32,.32,.46])box(x,1.51,z+d,.026,1.76,.041,'#6e5550');
    box(x,.2,z,.082,.16,2.50,'#b1895d');
  }
  box(0,.038,4.65,2.58,.01,12.6,'#592a3a');
  for(const x of [-1.3,1.3])box(x,.041,4.65,.034,.014,12.6,'#c79260');
  // Static interior pieces share two GPU batches. Keep the bag and moving gate separate.
  const batches=new Map();
  for(const mesh of [...root.children])if(mesh.isMesh&&mesh.geometry===boxGeo&&mesh!==bag&&mesh!==clasp){
    const lit=mesh.material.emissiveIntensity>0;mesh.updateMatrix();
    if(!batches.has(lit))batches.set(lit,[]);batches.get(lit).push(mesh);root.remove(mesh);
  }
  for(const [lit,items] of batches){
    const mat=lit?new T.MeshBasicMaterial({color:0xffd2ad}):new T.MeshStandardMaterial({color:0xffffff,roughness:.80,metalness:.05});
    const many=new T.InstancedMesh(boxGeo,mat,items.length);many.receiveShadow=!lit;
    items.forEach((item,i)=>{many.setMatrixAt(i,item.matrix);many.setColorAt(i,item.material.color);});root.add(many);
  }
  const alarm=new T.PointLight('#ee6483',0,13,1.9);alarm.position.set(0,2.8,-3.4);root.add(alarm);
  const lamp=new T.PointLight('#ffe2c2',28,20,1.65);lamp.position.set(-2.6,2.48,-4.4);root.add(lamp);
  const serviceLight=new T.PointLight('#ffe2bf',18,14,1.68);serviceLight.position.set(-2.18,2.63,8.6);root.add(serviceLight);
  const farLight=new T.PointLight('#ecc7b1',21,19,1.73);farLight.position.set(1.3,2.57,23.8);root.add(farLight);
  // Soft neutral bounce, eased away once the camera is outside the tower.
  const bounce=new T.AmbientLight('#f8dfd4',0);root.add(bounce);
  const key=new T.PointLight('#ffe0bf',0,6,1.55);key.position.set(-2.9,2.0,10.6);root.add(key);
  const runnerRoot=runner.root;root.add(runnerRoot,ally.root);runnerRoot.position.set(-2.3,.13,14.25);ally.root.position.set(-1.62,.13,14.0);
  const guardCfg=[{x:2.1,z:4.75,phase:0,jacket:'#4d4562'},{x:1.5,z:-3.0,phase:1.5,jacket:'#576575'},{x:-3.6,z:-8.95,phase:3.1,jacket:'#564757'},{x:3.2,z:20.1,phase:2.2,jacket:'#484b5b'},{x:-4.8,z:25.8,phase:3.4,jacket:'#414553'}];
  const guards=guardCfg.map((cfg,i)=>{const a=makeGuard?.(cfg,i)||person({portrait:i===1?'luzia':'davi',skin:['#976b59','#94645b','#c28f75'][i],jacket:cfg.jacket,hair:'#282137',pants:'#2d273d',type:1});a.root.position.set(cfg.x,.12,cfg.z);root.add(a.root);return {...cfg,a,stun:0,aware:0};});
  const canopy=new T.Group();canopy.visible=false;
  const chute=new T.Mesh(new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI*.55),new T.MeshStandardMaterial({color:'#e998b0',roughness:.65,side:T.DoubleSide}));chute.scale.set(2.48,.78,1.07);chute.position.y=3.78;canopy.add(chute);
  const cords=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-2.17,3.9,0,-.27,1.2,0,2.17,3.9,0,.27,1.2,0,-1.2,3.66,.80,-.16,1.18,.03,1.2,3.66,.8,.16,1.18,.03],3)),new T.LineBasicMaterial({color:'#f6dbdf'}));canopy.add(cords);root.add(canopy);
  const aim=new T.Line(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3)),new T.LineBasicMaterial({color:'#a0e3df',transparent:true,opacity:.85}));aim.visible=false;root.add(aim);
  const marker=new T.Mesh(new T.RingGeometry(.47,.53,32),new T.MeshBasicMaterial({color:'#ffbb9d',side:T.DoubleSide,transparent:true,opacity:.85}));marker.rotation.x=-Math.PI/2;marker.position.set(casinoLoot.x,.069,casinoLoot.z+1);root.add(marker);
  const arrowGeo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([
    -.20,0,.10, 0,0,-.16, -.10,0,.16,
    -.10,0,.16, 0,0,-.16, 0,0,-.008,
    .20,0,.10, .10,0,.16, 0,0,-.16,
    .10,0,.16, 0,0,-.008, 0,0,-.16,
  ],3));
  const guideArrows=new T.InstancedMesh(arrowGeo,new T.MeshBasicMaterial({color:'#ffe29a',side:T.DoubleSide,transparent:true,opacity:.89,depthWrite:false}),28);
  guideArrows.count=0;guideArrows.frustumCulled=false;root.add(guideArrows);
  const guideNode=new T.Object3D();
  const objectivePoint=new T.Vector3(),flatCam=new T.Vector3(),camAnchor=new T.Vector3(),projected=new T.Vector3(),screenMark={x:.5,y:.5,angle:0,meters:0,behind:false,area:'',near:false};
  let route=[],navTimer=0,navPhase='',navStep=-1,alarmAngle=null,witness=null,openingHint=null,openingSpoken=false,openingClock=0,allyPath=[],allyClock=0,fallDriftX=0,fallDriftZ=0,landingSpoken=false,dropAnswer=false;
  const p=runnerRoot.position;let phase='title',t=0,walk=0,velocity=0,open=false,air=0,deployAge=0,attack=0,flash=0,noticed=0,readyDrop=false,caught=0,hop=0,hopSpeed=0,hintKey='',stunCount=0,step=0,dropTalk=false,speaker='',voice=0;
  let checkpoint={x:-2.35,z:12.8};
  const target=new T.Vector3(),look=new T.Vector3(),camTo=new T.Vector3(),offset=new T.Vector3();let initialized=false;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const turn=(a,b,k,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-k*dt));
  function blocked(x,z,r=.28){return Math.abs(x)>5.9-r||z>30.26-r||z<(['escape','air','land','complete'].includes(phase)?-11.85:-7.1)+r||solid.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)||(phase!=='escape'&&Math.abs(z+7.3)<.18&&Math.abs(x)<1.34);}
  function visibleFrom(a,b,radius=.05){const length=dist(a,b);for(let d=.42;d<length-.34;d+=.37){const x=T.MathUtils.lerp(a.x,b.x,d/length),z=T.MathUtils.lerp(a.z,b.z,d/length);if(blocked(x,z,radius))return false;}return true;}
  function walkTo(actor,dx,dz,r){const a=actor.position,n=Math.ceil(Math.hypot(dx,dz)/.18)||1;for(let i=0;i<n;i++){if(!blocked(a.x+dx/n,a.z,r))a.x+=dx/n;if(!blocked(a.x,a.z+dz/n,r))a.z+=dz/n;}}
  function hint(title,text,key){const id=title+text+key;if(id===hintKey)return;hintKey=id;selectHint(title,text,key);}
  function updateMarker(){const next=annexSteps[step];if(next){marker.position.set(next.x,.072,next.z+(step===3?1:0));marker.visible=true;}}
  function interact(){
    if(phase!=='stealth')return false;
    const next=annexSteps[step];if(!next||dist(p,next)>=2.05)return false;
    runner.interact?.();
    if(step<annexSteps.length-1){
      onSearch(step);step++;checkpoint={x:p.x,z:p.z};effect('select');updateMarker();noticed*=.46;return true;
    }
    phase='alarm';alarmAngle=null;witness=guards.find(g=>visibleFrom(g.a.root.position,p))||guards[1];witness.a.interact?.();speaker='Davi';t=0;bag.visible=clasp.visible=false;marker.visible=false;
    // Hand-off happens where the player stood. Keep the same actors, room, and camera.
    let ended=false;
    const exit=()=>{if(ended||phase!=='alarm')return;ended=true;phase='escape';t=0;speaker='';marker.visible=true;marker.position.set(0,.07,-11.35);};
    onAlarm?.(new T.Vector3(p.x+casinoSite.x,casinoSite.y+p.y,p.z+casinoSite.z),exit,name=>{speaker=name;});
    return true;
  }
  function deploy(){if(open)return;open=true;deployAge=0;effect('chute');canopy.visible=true;canopy.scale.set(.08,.12,.14);runner.interact?.();}
  function jump(){
    if(phase==='escape'&&p.z<-9.75&&Math.abs(p.x)<3){phase='air';t=0;velocity=-1.4;effect('jump');open=false;air=0;readyDrop=false;marker.visible=false;fallDriftX=fallDriftZ=0;runner.jump?.();ally.jump?.();return true;}
    if(phase==='air'&&!open&&readyDrop){deploy();return true;}
    if((phase==='escape'||phase==='stealth')&&hop<.012){hopSpeed=4.4;effect('jump');runner.jump?.();return true;}
    return false;
  }
  function action(tool,heading=runnerRoot.rotation.y){
    if(phase==='air'){if(tool==='Parapente')jump();return;}
    if(phase!=='escape'||attack>0)return;attack=.38;const ranged=tool==='Pulso neon';effect(ranged?'pulse':'swing');
    if(tool==='Lanterna'){lamp.intensity=lamp.intensity===28?40:28;return;}
    const a=heading;runnerRoot.rotation.y=a;const dx=-Math.sin(a),dz=-Math.cos(a);
    const hit=guards.filter(g=>g.stun<=0).map(g=>{const q=g.a.root.position,d=dist(p,q);return {g,d,dot:((q.x-p.x)*dx+(q.z-p.z)*dz)/Math.max(d,.1)};}).filter(o=>o.d<(ranged?7.1:1.8)&&o.dot>(ranged?.79:.42)&&visibleFrom(p,o.g.a.root.position)).sort((a,b)=>a.d-b.d)[0];
    if(hit){hit.g.stun=ranged?4.4:3;stunCount++;announce('Segurança atordoado','Continue até o terraço.');}
    if(ranged){const b=aim.geometry.attributes.position,end=hit?.g.a.root.position;b.setXYZ(0,p.x,1.13,p.z);b.setXYZ(1,end?.x??p.x+dx*6.5,1.08,end?.z??p.z+dz*6.5);b.needsUpdate=true;aim.geometry.computeBoundingSphere();flash=.14;}
    runner.attack?.(ranged);
  }
  function update(dt,input,cam){
    t+=dt;attack=Math.max(0,attack-dt);flash=Math.max(0,flash-dt);aim.visible=flash>0;
    alarm.intensity=phase==='escape'||phase==='alarm'?7+Math.sin(t*2.35)**2*24:0;
    voice=input.voice||0;
    if(phase==='title'&&t>2.65){phase='arrival';t=0;marker.visible=false;onArrival(()=>{openingSpoken=true;});}
    if(phase==='arrival'){
      openingClock+=dt*(openingSpoken||t>26||openingClock<7.05?1:.035);
      const walkIn=t>.8&&t<6.5, drift=Math.sin(t*.61)*.14;
      if(walkIn){walkTo(runnerRoot,.15*dt,-.47*dt,.29);walkTo(ally.root,.18*dt,-.44*dt,.29);}
      const exchange=T.MathUtils.smootherstep(t,5.8,7.2)*(1-T.MathUtils.smootherstep(openingClock,10.7,openingSeconds));
      runnerRoot.rotation.y=turn(runnerRoot.rotation.y,drift-.45*exchange,4,dt);ally.root.rotation.y=turn(ally.root.rotation.y,.21+.55*exchange,4,dt);
      const leadTalk=input.voiceName==='Luzia',mateTalk=input.voiceName==='Davi';
      const a=ally.root.position,doorLook={x:-1.71,z:10.2};
      const aim=(self,next,yaw)=>clamp(Math.atan2(Math.sin(Math.atan2(self.x-next.x,self.z-next.z)-yaw),Math.cos(Math.atan2(self.x-next.x,self.z-next.z)-yaw)),-.85,.85);
      runner.animate(dt,walkIn?.32:0,0,{speaking:leadTalk,voice,look:aim(p,walkIn?doorLook:a,runnerRoot.rotation.y),sneakWalk:walkIn,pitch:-.075,scene:true,mood:'tense',gesture:leadTalk&&!walkIn});
      ally.animate(dt,walkIn?.32:0,0,{speaking:mateTalk,voice,look:aim(a,walkIn?doorLook:p,ally.root.rotation.y),sneakWalk:walkIn,pitch:-.06,scene:true,foldArms:exchange>.3,mood:mateTalk?'tense':null,gesture:mateTalk&&!walkIn});
      if(openingClock>openingSeconds){phase='stealth';t=0;updateMarker();}
    }
    if(phase==='alarm'){
      const d=dist(ally.root.position,p);if(d>1.1){const a=ally.root.position;walkTo(ally.root,(p.x-a.x)*dt*.61,(p.z-a.z)*dt*.61,.27);}
      const a=ally.root.position;
      const yawTo=Math.atan2(p.x-a.x,p.z-a.z);
      runnerRoot.rotation.y=turn(runnerRoot.rotation.y,yawTo,3.6,dt);ally.root.rotation.y=turn(ally.root.rotation.y,yawTo+Math.PI,4,dt);
      if(witness){
        const q=witness.a.root.position,h=Math.atan2(q.x-p.x,q.z-p.z),approach=t>2.0&&t<5.2&&dist(q,p)>3.1;
        witness.a.root.rotation.y=turn(witness.a.root.rotation.y,h,5,dt);
        if(approach)walkTo(witness.a.root,-Math.sin(h)*dt*.46,-Math.cos(h)*dt*.46,.30);
        witness.a.animate(dt,approach?.28:0,0,{gesture:t<1.9,look:.19,mood:'tense'});
      }
      runner.animate(dt,0,0,{speaking:speaker==='Luzia',voice,gesture:speaker==='Luzia',mood:'tense',look:.17});
      ally.animate(dt,d>1.1?.27:0,0,{speaking:speaker==='Davi',voice,gesture:speaker==='Davi',mood:'fear',look:.28});
      if(t>26)phase='escape';
    }
    if(phase==='escape')door.position.y=lerp(door.position.y,2.58,1-Math.exp(-dt*2.9));

    if(phase==='stealth'||phase==='escape'){
      const angle=input.yaw+Math.atan2(-input.side,input.forward),has=Math.hypot(input.side,input.forward)>.04,sneak=input.crouch&&phase==='stealth';
      const max=sneak?1.50:phase==='escape'?5.5:3.12;walk=lerp(walk,has?max:0,1-Math.exp(-dt*8));
      const ox=p.x,oz=p.z;
      if(has){runnerRoot.rotation.y=turn(runnerRoot.rotation.y,angle,12,dt);walkTo(runnerRoot,-Math.sin(angle)*walk*dt,-Math.cos(angle)*walk*dt,.31);}
      if(hop>0||hopSpeed>0){hopSpeed-=15.6*dt;hop=Math.max(0,hop+hopSpeed*dt);if(!hop){hopSpeed=0;runner.land?.();}}
      p.y=lerp(p.y,(sneak?-.015:.124)+hop,1-Math.exp(-dt*10));
      const stride=Math.min(1,Math.hypot(p.x-ox,p.z-oz)/Math.max(dt,.01)/3);
      runner.animate(dt,stride,phase==='escape'?.79:0,{air:hop>.025,crouch:sneak,hold:input.hold,look:sneak?.23:0});
      const a=ally.root.position,d=dist(a,p),ax=a.x,az=a.z;
      allyClock-=dt;
      if(d>1.34){
        const direct=visibleFrom(a,p,.28);
        if(!direct&&allyClock<=0){allyPath=indoorRoute(a,{x:p.x,z:p.z,radius:1.02},blocked);allyClock=.36;}
        let follow=p;
        if(!direct&&allyPath.length){
          const index=allyPath.reduce((best,q,i)=>dist(a,q)<dist(a,allyPath[best])?i:best,0);
          follow=allyPath.slice(index).find(q=>dist(a,q)>.51)||allyPath.at(-1);
        }
        const hy=Math.atan2(a.x-follow.x,a.z-follow.z);
        const sp=Math.min(sneak?2.12:phase==='escape'?5.85:3.6,Math.max(.43,(d-1.18)*3.7));
        walkTo(ally.root,-Math.sin(hy)*sp*dt,-Math.cos(hy)*sp*dt,.24);
        if(dist(a,{x:ax,z:az})>.002)ally.root.rotation.y=turn(ally.root.rotation.y,hy,10,dt);
      }
      a.y=lerp(a.y,sneak?-.015:.124,1-Math.exp(-dt*10));
      ally.animate(dt,Math.min(1,Math.hypot(a.x-ax,a.z-az)/(3*Math.max(dt,.01))),phase==='escape'?.72:0,{crouch:sneak,mood:phase==='escape'?'fear':'tense',look:-.19});
      let seen=false;
      for(const g of guards){const q=g.a.root.position;g.stun=Math.max(0,g.stun-dt);q.y=lerp(q.y,.12,1-Math.exp(-dt*6));g.a.root.rotation.z=lerp(g.a.root.rotation.z,g.stun>0?.31:0,1-Math.exp(-dt*6));
        if(g.stun>0){g.a.animate(dt,0,0,{mood:'shock',hurt:Math.min(1,g.stun*1.8)});continue;}
        const gd=dist(p,q),gx=phase==='escape'&&gd<10?p.x:g.x+Math.sin(t*.70+g.phase)*1.20,gz=phase==='escape'&&gd<10?p.z:g.z+Math.cos(t*.43+g.phase)*2.18;
        const h=Math.atan2(q.x-gx,q.z-gz),dd=Math.hypot(q.x-gx,q.z-gz),sp=phase==='escape'?2.55:1.06;
        if(dd>.25&&gd>1.04){walkTo(g.a.root,-Math.sin(h)*sp*dt,-Math.cos(h)*sp*dt,.31);g.a.root.rotation.y=turn(g.a.root.rotation.y,h,7,dt);}
        const facing=Math.cos(g.a.root.rotation.y-Math.atan2(q.x-p.x,q.z-p.z));if(gd<(sneak?2.4:5.42)&&facing>.47&&visibleFrom(q,p)){seen=true;if(phase==='stealth')caught+=dt*(sneak?.39:gd<2.4?1.62:1.05);}
        if(phase==='escape'&&gd<.87&&attack<=0){p.x=clamp(p.x+(p.x-q.x)*dt*.85,-5.57,5.57);walk*=.94;}
        g.a.animate(dt,dd>.25&&gd>1.04?.47:0,0,{mood:phase==='escape'?'anger':'cold'});
      }
      noticed=lerp(noticed,seen?1:0,1-Math.exp(-dt*2.2));if(!seen)caught=Math.max(0,caught-dt*1.3);
      if(phase==='stealth'&&caught>1.05){p.set(checkpoint.x,.125,checkpoint.z);ally.root.position.set(checkpoint.x+.63,.125,checkpoint.z+.42);caught=noticed=walk=0;initialized=false;announce('Um segurança viu vocês','Abaixe com Shift ao atravessar a área iluminada.');}

      if(phase==='stealth'){const next=annexSteps[step],near=dist(p,next)<2.05;hint(next.title,noticed>.52?'Estão olhando. Abaixe e interrompa a linha de visão.':next.tip,near?'E / INTERAGIR':'WASD MOVER · SHIFT ABAIXAR');}
      else hint(p.z<-9.7?'Salte do terraço':'Corra para o terraço',p.z<-9.7?'Pule pela abertura antes que eles cheguem.':'Passe pela porta iluminada. Você pode desviar ou atordoar os seguranças.',p.z<-9.7?'ESPAÇO / PULAR':'WASD · CLIQUE PARA USAR');
    }else if(phase==='air'){
      air+=dt;
      if(air>.85&&!dropTalk){dropTalk=true;onDrop(0);}
      if(air>=7.5&&!dropAnswer){dropAnswer=true;onDrop(3);}
      if(!readyDrop&&air>=chuteWait){readyDrop=true;onDrop(1);}
      if(open)deployAge+=dt;
      const fall=glideStep(p.y,velocity,open,dt);p.y=fall.y;velocity=fall.velocity;
      const baseX=dropLine.x-casinoSite.x,baseZ=dropLine.z-casinoSite.z;
      const altitude=p.y+casinoSite.y,steer=open?6.3:2.25;
      fallDriftX=clamp(fallDriftX+input.side*steer*dt,-9,25);
      fallDriftZ=clamp(fallDriftZ-input.forward*steer*dt,-37,18);
      const nx=lerp(p.x,baseX+fallDriftX,1-Math.exp(-dt*(open?1.45:.34)));
      const nz=lerp(p.z,baseZ+fallDriftZ,1-Math.exp(-dt*(open?1.31:.21)));
      const safe=(x,z)=>canLand(x+casinoSite.x,z+casinoSite.z);
      if(altitude>10||safe(nx,nz)){p.x=nx;p.z=nz;}
      else{
        if(safe(nx,p.z))p.x=nx;if(safe(p.x,nz))p.z=nz;
        if(!safe(p.x,p.z)){
          fallDriftX=lerp(fallDriftX,0,1-Math.exp(-dt*5));fallDriftZ=lerp(fallDriftZ,0,1-Math.exp(-dt*5));
          p.x=lerp(p.x,baseX,1-Math.exp(-dt*4));p.z=lerp(p.z,baseZ,1-Math.exp(-dt*4));
        }
      }
      const sway=Math.sin(air*1.8)*.08-input.side*.34,searching=!open&&air>3;
      const marry=readyDrop?1:clamp((air-8)/8,0,1);
      runnerRoot.rotation.y=turn(runnerRoot.rotation.y,-input.side*.39,7,dt);runnerRoot.rotation.z=lerp(runnerRoot.rotation.z,sway,1-Math.exp(-dt*4));
      runner.animate(dt,0,0,{air:air<.64,fall:air>.53&&!open,canopy:open,pitch:open?.05:-.09,look:searching?-.78:.30,speaking:input.voiceName==='Luzia',voice,reach:marry});
      runnerRoot.rotation.x=lerp(runnerRoot.rotation.x,open?-.07:air<.7?-.24:-1.04,1-Math.exp(-dt*(open?4.1:2.4)));
      const a=ally.root.position;a.x=lerp(a.x,p.x+(open?.38:.65+.20*Math.sin(air*1.02)*(1-marry)),1-Math.exp(-dt*6));
      a.y=lerp(a.y,p.y+(open?.03:.24*Math.sin(air*1.87)),1-Math.exp(-dt*24));a.z=lerp(a.z,p.z+(open?.26:.62-.29*marry),1-Math.exp(-dt*6));
      ally.root.rotation.x=runnerRoot.rotation.x*.89;ally.root.rotation.y=.09;ally.root.rotation.z=-sway*.66;
      ally.animate(dt,0,0,{air:air<.64,fall:air>.53&&!open,canopy:open,mood:'fear',look:searching?-.82:-.42,speaking:input.voiceName==='Davi',voice,reach:marry});
      if(open){
        const infl=T.MathUtils.smootherstep(deployAge,0,1.4);canopy.position.copy(p);canopy.rotation.z=sway*.67;canopy.scale.set(.08+.92*infl,.12+.88*infl,.14+.86*infl);
        hint('Desça com o paraquedas','Alinhe com a avenida. O carro está lá embaixo.','W A S D / GUIAR');
      }else hint(readyDrop?'Puxe a alça':'Em queda',readyDrop?'Luzia encontrou a alça. Abra agora.':'Davi está procurando a alça. Mantenha os dois juntos.',readyDrop?'ESPAÇO / ABRIR':'W A S D / GUIAR');
      if(!open&&p.y+casinoSite.y<15){deploy();announce('A alça abriu','Luzia puxou o paraquedas de emergência.');}
      if(p.y+casinoSite.y<.13){phase='land';t=0;open=false;runner.land?.();ally.land?.();onDrop(2,()=>{landingSpoken=true;});}
    }else if(phase==='land'){
      p.y=-casinoSite.y+.125;const a=ally.root.position;a.y=p.y;
      runnerRoot.rotation.x*=Math.exp(-dt*5);ally.root.rotation.x*=Math.exp(-dt*5);
      runnerRoot.rotation.z*=Math.exp(-dt*5);runner.animate(dt,0,0,{brace:t<.86,scene:true,pitch:.04,look:-.44});ally.animate(dt,0,0,{brace:t<.86,scene:true,mood:'tense',look:-.62,speaking:input.voiceName==='Davi',voice});
      canopy.position.copy(p);canopy.position.z-=t*1.3;canopy.scale.set(1+t*.20,Math.max(.018,1-t*.57),Math.max(.045,1-t*.23));
      if(t>2.4)canopy.visible=false;
      hint('','','');
      if(t>5.1&&(landingSpoken||t>10.5)){phase='complete';onLand({x:p.x+casinoSite.x,z:p.z+casinoSite.z,stunCount,companion:{x:a.x+casinoSite.x,z:a.z+casinoSite.z,yaw:ally.root.rotation.y}});return;}
    }
    if(['title','arrival','alarm'].includes(phase))hint('','', '');
    const indoor=!['air','land','complete'].includes(phase),directed=phase==='arrival'||phase==='alarm';
    bounce.intensity=lerp(bounce.intensity,indoor?.78:.04,1-Math.exp(-dt*2.7));
    key.intensity=lerp(key.intensity,directed?(phase==='arrival'?10.2:8.6):0,1-Math.exp(-dt*4.6));
    const chase=phase==='air'||phase==='land',heading=input.yaw,pitch=input.elevation||0;
    let fov=61;
    if(phase==='title'||phase==='arrival'){
      const shot=openingDolly(phase==='title'?0:openingClock,p,ally.root.position,heading,pitch);
      camAnchor.set(shot.lx,p.y+shot.ly,shot.lz);flatCam.set(shot.x,p.y+shot.y,shot.z);fov=shot.fov;
      key.position.set(shot.x-.32,Math.min(2.53,shot.y+.35),shot.z-.30);
      openingHint=openingClock<7.2?'frontal':'handoff';
    }else if(phase==='alarm'){
      const a=ally.root.position,partyAngle=Math.atan2(p.x-a.x,p.z-a.z),blend=T.MathUtils.smootherstep(t,0,1.75);
      camAnchor.set(lerp(p.x,a.x,.45*blend),p.y+lerp(1.28,1.51,blend),lerp(p.z,a.z,.45*blend));
      if(alarmAngle===null){
        // Choose the free side of the actual aisle, wherever the player was standing.
        const candidates=[partyAngle+Math.PI*.5,partyAngle-Math.PI*.5,heading+1.42,heading-1.42];
        let best=0;alarmAngle=heading;
        for(const angle of candidates){const nx=p.x+Math.sin(angle)*2.35,nz=p.z+Math.cos(angle)*2.35;
          const cover=Math.min(cameraClear(camAnchor.x,camAnchor.z,1.52,nx,nz,1.57),cameraClear(a.x,a.z,1.5,nx,nz,1.57));
          if(cover>best){best=cover;alarmAngle=angle;}
        }
      }
      const start=heading+Math.atan2(.58,2.18),angle=start+Math.atan2(Math.sin(alarmAngle-start),Math.cos(alarmAngle-start))*blend;
      flatCam.set(camAnchor.x+Math.sin(angle)*2.42,p.y+lerp(2.34+pitch*.53,1.77,blend),camAnchor.z+Math.cos(angle)*2.42);
      key.position.set(flatCam.x-.42,2.26,flatCam.z+.13);fov=lerp(60,48,blend);openingHint='discovery';
    }else{
      const a=ally.root.position;
      const landing=phase==='land'?T.MathUtils.smootherstep(t,0,2.22):0;
      const windup=phase==='air'&&!open?T.MathUtils.smootherstep(air,1.5,6)*(1-T.MathUtils.smootherstep(air,13,18)):0;
      const orbit=chase?-.51*Math.sin(air*.23)-windup*1.26-landing*1.71:heading;
      camAnchor.set(lerp(p.x,a.x,.29*landing),p.y+(chase?lerp(1.13,1.48,landing):1.28),lerp(p.z,a.z,.29*landing));
      const r=chase?lerp(5.5,3.7,landing):2.18,high=chase?lerp(2.24,.61,landing):1.06+pitch*.53;
      flatCam.set(p.x+Math.sin(orbit)*r+.58*Math.cos(orbit),camAnchor.y+high,p.z+Math.cos(orbit)*r-.58*Math.sin(orbit));
      fov=chase?lerp(open?59:69,57,landing):61;openingHint=phase==='land'?'landing':null;
    }
    if(!chase){
      const clear=cameraClear(camAnchor.x,camAnchor.z,camAnchor.y,flatCam.x,flatCam.z,flatCam.y);
      if(clear<1){flatCam.lerp(camAnchor,1-clear);flatCam.y=Math.min(2.69,flatCam.y);}
    }
    target.set(camAnchor.x+casinoSite.x,camAnchor.y+casinoSite.y,camAnchor.z+casinoSite.z);
    camTo.set(flatCam.x+casinoSite.x,flatCam.y+casinoSite.y,flatCam.z+casinoSite.z);
    if(!initialized){cam.position.copy(camTo);look.copy(target);initialized=true;}else cam.position.lerp(camTo,1-Math.exp(-dt*(directed?6.5:5.2)));
    look.lerp(target,1-Math.exp(-dt*7.6));cam.lookAt(look);cam.fov=lerp(cam.fov,fov,1-Math.exp(-dt*6));cam.updateProjectionMatrix();
    updateGuide(dt,cam,heading);
  }
  function cameraClear(x,z,y,nx,nz,ny){
    for(let u=.12;u<=1.015;u+=.055){
      const qx=lerp(x,nx,u),qz=lerp(z,nz,u),qy=lerp(y,ny,u);
      if(Math.abs(qx)>5.87||qz>30.12||qz< -11.72||solid.some(b=>qy<b.top+.11&&Math.abs(qx-b.x)<b.w*.5+.14&&Math.abs(qz-b.z)<b.d*.5+.14))return Math.max(.19,u-.11);
    }
    return 1;
  }
  function updateGuide(dt,cam,heading){
    if(phase!=='stealth'&&phase!=='escape'){guideArrows.count=0;return;}
    const point=phase==='stealth'?annexSteps[step]:{x:0,z:-10.95,radius:.92,area:'SAÍDA / TERRAÇO'};
    navTimer-=dt;
    if(navTimer<=0||navPhase!==phase||navStep!==step){
      navTimer=.29;navPhase=phase;navStep=step;route=indoorRoute(p,point,blocked);
      let sampled=0,last=p,run=0,k=0;
      for(let i=0;i<route.length&&k<28;i++){
        const q=route[i],d=dist(last,q);sampled+=d;run+=d;
        if(sampled>.72&&run>=.72){
          const next=route[i+1]||q;guideNode.position.set(q.x,.069,q.z);guideNode.rotation.y=Math.atan2(last.x-next.x,last.z-next.z);
          guideNode.updateMatrix();guideArrows.setMatrixAt(k++,guideNode.matrix);run=0;
        }
        last=q;
      }
      guideArrows.count=k;guideArrows.instanceMatrix.needsUpdate=true;
    }
    const near=dist(p,point)<(phase==='stealth'?2.05:1.6);
    const next=!near&&route.find(q=>dist(p,q)>2.1)||point;
    objectivePoint.set(next.x+casinoSite.x,casinoSite.y+(near?.97:.43),next.z+casinoSite.z);
    cam.updateMatrixWorld();projected.copy(objectivePoint).applyMatrix4(cam.matrixWorldInverse);
    const behind=projected.z>-.23,turnSign=Math.sin(Math.atan2(p.x-next.x,p.z-next.z)-heading);
    projected.copy(objectivePoint).project(cam);
    screenMark.x=behind?(turnSign>0?.09:.91):clamp(.5+.5*projected.x,.09,.91);
    screenMark.y=behind?.50:clamp(.5-.5*projected.y,.25,.78);
    screenMark.behind=behind||Math.abs(projected.x)>.81;
    screenMark.angle=screenMark.behind?(screenMark.x<.5?-90:90):180;
    screenMark.meters=Math.max(0,Math.round(route.reduce((sum,q,i)=>sum+dist(i?route[i-1]:p,q),0)+dist(route.at(-1)||p,point)));
    screenMark.area=point.area;screenMark.near=near;
  }
  return { update,interact,jump,action,finish(){runnerRoot.visible=ally.root.visible=canopy.visible=marker.visible=false;guideArrows.count=0;key.intensity=bounce.intensity=serviceLight.intensity=farLight.intensity=0;for(const g of guards)g.a.root.visible=false;alarm.intensity=lamp.intensity=0;runner.disposeOutfits?.();}, get phase(){return phase;},get direction(){return phase==='stealth'||phase==='escape'?screenMark:null;},get waypoints(){return route.map(q=>({...q}));},get shot(){return openingHint;}, get title(){return phase==='title';}, get alarm(){return phase==='alarm';}, get noticed(){return noticed;},get canopy(){return open;},get titleBeat(){return open&&deployAge<6;},get interactable(){return phase==='stealth'&&dist(p,annexSteps[step])<2.05;} };
}
