import * as T from 'three';
import { person } from './actors.js';
import { castStyles } from './cinematics.js';
export const casinoSite={x:208.6,y:22.5,z:177};
export const casinoLoot={x:-2.75,z:-5.5};
const clamp=T.MathUtils.clamp;
const lerp=T.MathUtils.lerp;
export function glideStep(y,velocity,open,dt){
  const v=open?Math.max(-3.9,velocity+(-3.9-velocity)*(1-Math.exp(-11*dt))):Math.max(-21,velocity-13.5*dt);
  return {y:y+v*dt,velocity:v};
}
export function makeHeist(scene,{runner,announce,onAlarm,onDrop,onLand,selectHint,effect=()=>{}}){
  const root=new T.Group();root.position.set(casinoSite.x,casinoSite.y,casinoSite.z);scene.add(root);
  const solid=[];const cache=new Map();
  const material=(c,g=false)=>{const key=c+g;if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color:c,roughness:g?.45:.77,metalness:g?.27:.027,emissive:g?c:0,emissiveIntensity:g?.24:0}));return cache.get(key);};
  const boxGeo=new T.BoxGeometry();
  function box(x,y,z,w,h,d,c,{glow=false,wall=false,yaw=0}={}){const m=new T.Mesh(boxGeo,material(c,glow));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=yaw;m.castShadow=false;m.receiveShadow=true;root.add(m);if(wall)solid.push({x,z,w,d,top:y+h/2});return m;}
  box(0,-9.15,1.6,15,18,22,'#56445f');box(0,-.40,0,15,.76,24.5,'#67516a');
  box(0,-.034,3.95,12,.068,15.3,'#49394f');
  for(let i=-5;i<=5;i++)for(let j=-7;j<=8;j++)if((i+j)%2===0)box(i*1.06,.009,j*.87+2.3,1.03,.021,.85,'#594354');
  box(0,.026,5.2,3,.026,13.3,'#7e445f');
  for(const x of [-6.1,6.1]){
    box(x,1.4,1.15,.32,2.85,18.2,'#33273e',{wall:true});
    box(x,1.25,-10.6,.25,2.42,4.15,'#61566a',{wall:true});
    for(let z=-6;z<11;z+=2.6){box(x*.974,1.49,z,.12,2.22,.16,'#a46d78');box(x*.946,2.44,z,.067,.055,1.7,'#eda3a9',{glow:true});}
    for(let z=-7;z<12;z+=4.5){box(x,-3.6,z,.18,4.1,1.3,'#877990');box(x,-3.52,z,.2,3.7,1.12,'#55466a');}
  }
  box(0,1.4,11.5,12,3,.3,'#3e2b48',{wall:true});
  for(const z of [2.6,8.5]){
    const shade=new T.Mesh(new T.TorusGeometry(.79,.038,7,32),material('#e3aa8a',true));shade.rotation.x=-Math.PI/2;shade.position.set(0,2.77,z);root.add(shade);
    for(const x of [-.65,.65])box(x,2.83,z,.028,.35,.027,'#c49885');
  }
  if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=512;c.height=110;const ctx=c.getContext('2d');ctx.fillStyle='#251728';ctx.fillRect(0,0,512,110);ctx.strokeStyle='#bc826e';ctx.lineWidth=3;ctx.strokeRect(7,8,498,94);ctx.font='italic bold 52px Georgia';ctx.textAlign='center';ctx.fillStyle='#f3c1ab';ctx.fillText('MIRAGEM',256,68);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(4.5,1.0),new T.MeshBasicMaterial({map}));sign.position.set(-5.90,1.84,.8);sign.rotation.y=Math.PI/2;root.add(sign);
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
  const bag=box(casinoLoot.x,1.14,casinoLoot.z,.53,.29,.35,'#8b5459');const clasp=box(casinoLoot.x,1.15,casinoLoot.z+.18,.24,.06,.027,'#ffba8e',{glow:true});
  for(const x of [-4.6,4.6]){box(x,.42,-11.95,3.04,.85,.24,'#6f5a74',{wall:true});box(x,.86,-11.95,3.09,.09,.33,'#b994a9');}
  for(const x of [-1.10,1.10])box(x,.025,-11.3,.16,.048,1.8,'#9fcdb9',{glow:true});
  const door=box(0,1.22,-7.3,2.51,2.44,.20,'#795269');
  const alarm=new T.PointLight('#ee6483',0,13,1.9);alarm.position.set(0,2.8,-3.4);root.add(alarm);
  const lamp=new T.PointLight('#eed4ad',21,18,1.55);lamp.position.set(-2.6,2.48,-4.4);root.add(lamp);
  const runnerRoot=runner.root,ally=person(castStyles.Davi);root.add(runnerRoot,ally.root);runnerRoot.position.set(0,.13,9.75);ally.root.position.set(.8,.13,10.25);
  const guardCfg=[{x:2.1,z:4.75,phase:0,jacket:'#4d4562'},{x:1.5,z:-3.0,phase:1.5,jacket:'#576575'},{x:-3.6,z:-8.95,phase:3.1,jacket:'#564757'}];
  const guards=guardCfg.map((cfg,i)=>{const a=person({portrait:i===1?'luzia':'davi',skin:['#976b59','#94645b','#c28f75'][i],jacket:cfg.jacket,hair:'#282137',pants:'#2d273d',type:1});a.root.position.set(cfg.x,.12,cfg.z);root.add(a.root);return {...cfg,a,stun:0,aware:0};});
  const canopy=new T.Group();canopy.visible=false;
  const chute=new T.Mesh(new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI*.55),new T.MeshStandardMaterial({color:'#e998b0',roughness:.65,side:T.DoubleSide}));chute.scale.set(2.48,.78,1.07);chute.position.y=3.78;canopy.add(chute);
  const cords=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-2.17,3.9,0,-.27,1.2,0,2.17,3.9,0,.27,1.2,0,-1.2,3.66,.80,-.16,1.18,.03,1.2,3.66,.8,.16,1.18,.03],3)),new T.LineBasicMaterial({color:'#f6dbdf'}));canopy.add(cords);root.add(canopy);
  const aim=new T.Line(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3)),new T.LineBasicMaterial({color:'#a0e3df',transparent:true,opacity:.85}));aim.visible=false;root.add(aim);
  const marker=new T.Mesh(new T.RingGeometry(.47,.53,32),new T.MeshBasicMaterial({color:'#ffbb9d',side:T.DoubleSide,transparent:true,opacity:.85}));marker.rotation.x=-Math.PI/2;marker.position.set(casinoLoot.x,.069,casinoLoot.z+1);root.add(marker);
  const p=runnerRoot.position;let phase='title',t=0,walk=0,velocity=0,open=false,air=0,attack=0,flash=0,noticed=0,readyDrop=false,caught=0,hop=0,hopSpeed=0,hintKey='',stunCount=0;
  const target=new T.Vector3(),camTo=new T.Vector3(),offset=new T.Vector3();let initialized=false;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const turn=(a,b,k,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-k*dt));
  function blocked(x,z,r=.28){return Math.abs(x)>5.9-r||z>11.3-r||z<(phase==='escape'?-11.85:-7.1)+r||solid.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)||(phase!=='escape'&&Math.abs(z+7.3)<.18&&Math.abs(x)<1.34);}
  function visibleFrom(a,b){const length=dist(a,b);for(let d=.42;d<length-.34;d+=.37){const x=T.MathUtils.lerp(a.x,b.x,d/length),z=T.MathUtils.lerp(a.z,b.z,d/length);if(blocked(x,z,.05))return false;}return true;}
  function walkTo(actor,dx,dz,r){const a=actor.position,n=Math.ceil(Math.hypot(dx,dz)/.18)||1;for(let i=0;i<n;i++){if(!blocked(a.x+dx/n,a.z,r))a.x+=dx/n;if(!blocked(a.x,a.z+dz/n,r))a.z+=dz/n;}}
  function hint(title,text,key){const id=title+text+key;if(id===hintKey)return;hintKey=id;selectHint(title,text,key);}
  function interact(){
    if(phase==='stealth'&&dist(p,casinoLoot)<2){phase='alarm';t=0;bag.visible=clasp.visible=false;marker.visible=false;runnerRoot.visible=ally.root.visible=false;
      onAlarm(new T.Vector3(p.x+casinoSite.x,casinoSite.y+.12,p.z+casinoSite.z),()=>{phase='escape';t=0;door.visible=false;runnerRoot.visible=ally.root.visible=true;marker.visible=true;marker.position.set(0,.07,-11.35);initialized=false;});return true;}
    return false;
  }
  function jump(){
    if(phase==='escape'&&p.z<-9.75&&Math.abs(p.x)<3){phase='air';t=0;velocity=-1.2;effect('jump');open=false;air=0;readyDrop=false;marker.visible=false;onDrop(0);return true;}
    if(phase==='air'&&!open&&p.y<-11.4){open=true;effect('chute');canopy.visible=true;return true;}
    if((phase==='escape'||phase==='stealth')&&hop<.012){hopSpeed=4.4;effect('jump');return true;}
    return false;
  }
  function action(tool){
    if(phase==='air'){if(tool==='Parapente')jump();return;}
    if(phase!=='escape'||attack>0)return;attack=.38;const ranged=tool==='Pulso neon';effect(ranged?'pulse':'swing');
    if(tool==='Lanterna'){lamp.intensity=lamp.intensity===21?36:21;return;}
    const a=runnerRoot.rotation.y,dx=-Math.sin(a),dz=-Math.cos(a);
    const hit=guards.filter(g=>g.stun<=0).map(g=>{const q=g.a.root.position,d=dist(p,q);return {g,d,dot:((q.x-p.x)*dx+(q.z-p.z)*dz)/Math.max(d,.1)};}).filter(o=>o.d<(ranged?7.1:1.8)&&o.dot>(ranged?.79:.42)&&visibleFrom(p,o.g.a.root.position)).sort((a,b)=>a.d-b.d)[0];
    if(hit){hit.g.stun=ranged?4.4:3;stunCount++;announce('Segurança atordoado','Continue até o terraço.');}
    if(ranged){const b=aim.geometry.attributes.position,end=hit?.g.a.root.position;b.setXYZ(0,p.x,1.13,p.z);b.setXYZ(1,end?.x??p.x+dx*6.5,1.08,end?.z??p.z+dz*6.5);b.needsUpdate=true;aim.geometry.computeBoundingSphere();flash=.14;}
    runner.interact?.();
  }
  function update(dt,input,cam){
    t+=dt;attack=Math.max(0,attack-dt);flash=Math.max(0,flash-dt);aim.visible=flash>0;
    alarm.intensity=phase==='escape'||phase==='alarm'?16+Math.sin(t*11)**4*43:0;
    if(phase==='title'&&t>2.05){phase='stealth';t=0;}
    if(phase==='stealth'||phase==='escape'){
      const angle=input.yaw+Math.atan2(-input.side,input.forward),has=Math.hypot(input.side,input.forward)>.04,sneak=input.crouch&&phase==='stealth';
      const max=sneak?1.50:phase==='escape'?5.5:3.12;walk=lerp(walk,has?max:0,1-Math.exp(-dt*8));
      const ox=p.x,oz=p.z;
      if(has){runnerRoot.rotation.y=turn(runnerRoot.rotation.y,angle,12,dt);walkTo(runnerRoot,-Math.sin(angle)*walk*dt,-Math.cos(angle)*walk*dt,.31);}
      if(hop>0||hopSpeed>0){hopSpeed-=15.6*dt;hop=Math.max(0,hop+hopSpeed*dt);if(!hop)hopSpeed=0;}
      p.y=lerp(p.y,(sneak?-.015:.124)+hop,1-Math.exp(-dt*10));
      const stride=Math.min(1,Math.hypot(p.x-ox,p.z-oz)/Math.max(dt,.01)/3);runner.animate(dt,stride,phase==='escape'?.79:0);
      const a=ally.root.position,d=dist(a,p),hy=Math.atan2(a.x-p.x,a.z-p.z);
      if(d>.89){const sp=Math.min((d-.84)*6,walk+.85);walkTo(ally.root,-Math.sin(hy)*sp*dt,-Math.cos(hy)*sp*dt,.24);ally.root.rotation.y=turn(ally.root.rotation.y,hy,10,dt);}
      a.y=p.y;ally.animate(dt,d>.91?Math.min(1,walk/3):0,phase==='escape'?.61:0,{mood:phase==='escape'?'fear':'tense',look:-.39});
      let seen=false;
      for(const g of guards){const q=g.a.root.position;g.stun=Math.max(0,g.stun-dt);q.y=lerp(q.y,g.stun>0?-.44:.12,1-Math.exp(-dt*6));g.a.root.rotation.z=lerp(g.a.root.rotation.z,g.stun>0?.31:0,1-Math.exp(-dt*6));
        if(g.stun>0){g.a.animate(dt,0,0,{mood:'shock'});continue;}
        const gd=dist(p,q),gx=phase==='escape'&&gd<10?p.x:g.x+Math.sin(t*.70+g.phase)*1.20,gz=phase==='escape'&&gd<10?p.z:g.z+Math.cos(t*.43+g.phase)*2.18;
        const h=Math.atan2(q.x-gx,q.z-gz),dd=Math.hypot(q.x-gx,q.z-gz),sp=phase==='escape'?2.55:1.06;
        if(dd>.25&&gd>1.04){walkTo(g.a.root,-Math.sin(h)*sp*dt,-Math.cos(h)*sp*dt,.31);g.a.root.rotation.y=turn(g.a.root.rotation.y,h,7,dt);}
        const facing=Math.cos(g.a.root.rotation.y-Math.atan2(q.x-p.x,q.z-p.z));if(gd<(sneak?1.42:3.30)&&facing>.56&&visibleFrom(q,p)){seen=true;if(gd<1.5&&!sneak&&phase==='stealth')caught+=dt;}
        if(phase==='escape'&&gd<.87&&attack<=0){p.x=clamp(p.x+(p.x-q.x)*dt*.85,-5.57,5.57);walk*=.94;}
        g.a.animate(dt,dd>.25&&gd>1.04?.47:0,0,{mood:phase==='escape'?'anger':'cold'});
      }
      noticed=lerp(noticed,seen?1:0,1-Math.exp(-dt*2.2));if(!seen)caught=Math.max(0,caught-dt*1.3);
      if(phase==='stealth'&&caught>.92){p.set(0,.125,9.74);ally.root.position.set(.8,.125,10.24);caught=noticed=walk=0;initialized=false;announce('Um segurança viu vocês','Abaixe com Shift ao atravessar a área iluminada.');}

      if(phase==='stealth'){const near=dist(p,casinoLoot)<2;hint(near?'Pegue a fita':'Atravesse o salão',near?'A maleta está sobre o balcão.':noticed>.42?'Tem um segurança olhando. Vire pelo tapete ou abaixe.':'Evite os seguranças e siga o brilho no balcão.',near?'E / INTERAGIR':'WASD · SHIFT');}
      else hint(p.z<-9.7?'Salte do terraço':'Corra para o terraço',p.z<-9.7?'Pule pela abertura antes que eles cheguem.':'Passe pela porta iluminada. Você pode desviar ou atordoar os seguranças.',p.z<-9.7?'ESPAÇO / PULAR':'WASD · CLIQUE PARA USAR');
    }else if(phase==='air'){
      air+=dt;if(!readyDrop&&p.y<-10.3){readyDrop=true;onDrop(1);}
      const fall=glideStep(p.y,velocity,open,dt);p.y=fall.y;velocity=fall.velocity;
      const aimX=clamp(-.5+input.side*1.4,-2,2);p.x=lerp(p.x,aimX,1-Math.exp(-dt*(open?2.2:.85)));p.z-=dt*(open?2.1:4.0);
      runnerRoot.rotation.y=turn(runnerRoot.rotation.y,0,8,dt);runner.animate(dt,.28,.6);runnerRoot.rotation.x=lerp(runnerRoot.rotation.x,open?-.09:-.42,1-Math.exp(-dt*5));
      ally.root.position.set(p.x+.61,p.y+.038,p.z+.34);ally.root.rotation.x=runnerRoot.rotation.x;ally.root.rotation.y=.09;ally.animate(dt,0,0,{seated:true,mood:'fear',look:-.74});
      if(open){canopy.position.copy(p);canopy.rotation.z=input.side*.16;canopy.scale.setScalar(Math.min(1,.45+Math.max(0,air-.55)*.9));hint('Desça com o paraquedas','Segure a direção. O carro está junto à rua.','A / D PARA AJUSTAR');}
      else hint(readyDrop?'Abra o paraquedas':'Em queda','Luzia está segurando o paraquedas dos dois.',readyDrop?'ESPAÇO / ABRIR':'AGUARDE A DICA');
      if(!open&&p.y< -16.9){open=true;canopy.visible=true;announce('Paraquedas de emergência','Luzia puxou a alça a tempo.');}
      if(p.y< -casinoSite.y+.14){phase='complete';root.visible=false;onDrop(2);onLand({x:p.x+casinoSite.x,z:p.z+casinoSite.z,stunCount});return;}
    }
    if(phase==='title')hint('','', '');
    const chase=phase==='air',heading=input.yaw, orbit=chase?0:heading,pitch=input.elevation||0;
    target.set(p.x+casinoSite.x,p.y+casinoSite.y+(chase?1.2:1.11),p.z+casinoSite.z);
    const r=chase?5.75:3.4,high=chase?2.65:1.65+pitch*.72;
    offset.set(Math.sin(orbit)*r+.28,high,Math.cos(orbit)*r);
    if(!chase){
      for(let t=.15;t<=1.01;t+=.075){
        const qx=p.x+offset.x*t,qz=p.z+offset.z*t,qy=p.y+1.11+offset.y*t;
        if(Math.abs(qx)>5.88||qz>11.09||qz< -11.72||solid.some(b=>qy<b.top+.15&&Math.abs(qx-b.x)<b.w*.5+.21&&Math.abs(qz-b.z)<b.d*.5+.21)){
          const f=Math.max(.18,t-.13);offset.x*=f;offset.z*=f;offset.y=Math.min(offset.y,1.34+f*.29);break;
        }
      }
    }

    camTo.copy(target).add(offset);if(!initialized){cam.position.copy(camTo);initialized=true;}else cam.position.lerp(camTo,1-Math.exp(-dt*5.2));
    cam.lookAt(target);cam.fov=lerp(cam.fov,chase?66:58,1-Math.exp(-dt*6));cam.updateProjectionMatrix();
  }
  return { update,interact,jump,action,finish(){root.visible=false;}, get phase(){return phase;}, get title(){return phase==='title';}, get alarm(){return phase==='alarm';}, get noticed(){return noticed;} };
}
