import * as T from 'three';
import { carShape, circleBox, createCollision } from './collision.js';
import { casinoSite } from './miragem.js';
import { jetskiDock } from './watercraft.js';
import { cityClock } from './daylight.js';
import { wardrobe, streetSpots, home } from './district-services.js';
export const XS=[-786,-720,-654,-588,-522,-456,-390,-324,-258,-192,-126,-60,6,72,138,204], ZS=[-300,-234,-168,-102,-36,30,96,162,228,294,360,426,492,558];
export const districts=[{x:151,z:70,name:'Ocean Beach'},{x:114,z:-192,name:'Porto Violeta'},{x:-152,z:-133,name:'Distrito Art Déco'},{x:-181,z:167,name:'Miramar'},{x:57,z:193,name:'South Point'},{x:-277,z:-263,name:'Ilha da Alfândega'},{x:-393,z:161,name:'Vila Mangue'},{x:-100,z:417,name:'Doca Sul'},{x:-590,z:151,name:'Jardim das Palmeiras'},{x:-557,z:-166,name:'Distrito Ferroviário'},{x:-751,z:248,name:'Reserva das Garças'},{x:65,z:516,name:'Jardins de Sal'}];
let seed=9;
export function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
export function createWorld(scene, night){
  seed=9;
  const color = new T.Color(night ? '#4c4276' : '#d986a5');
  scene.fog=new T.FogExp2(color,.0036); scene.background=color;
  const sky=new T.Mesh(new T.SphereGeometry(680,36,20),new T.ShaderMaterial({side:T.BackSide, depthWrite:false, fog:false, uniforms:{top:{value:new T.Color(night?'#171936':'#4d356c')},bottom:{value:new T.Color(night?'#75446c':'#ffb797')}, sunColor:{value:new T.Color(night?'#ddd4ff':'#ffcd94')}, sunDir:{value:new T.Vector3(.51,.22,-.85).normalize()},night:{value:night?1:0}}, vertexShader:`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top,bottom,sunColor,sunDir;uniform float night;varying vec3 v;float hash(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 d=normalize(v);float h=max(d.y,0.);float s=length(d-sunDir);vec3 c=mix(bottom,top,smoothstep(-.08,.55,h));c=mix(c,sunColor,.29*exp(-s*5.));float disc=1.-smoothstep(.070,.074,s);float stripes=(1.-smoothstep(-.036,-.013,d.y-sunDir.y))*step(.77,fract(d.y*72.));vec2 q=vec2(atan(d.x,-d.z),d.y)*vec2(116.,188.);float stars=step(.987,hash(floor(q)))*(1.-smoothstep(.04,.24,length(fract(q)-.5)))*smoothstep(.04,.35,h);
 float soft=sin(q.x*.055+sin(q.y*.18)*1.7)+sin(q.y*.37+q.x*.031)*.41+sin(q.x*.15+q.y*.23)*.25;
 float haze=smoothstep(.65,1.15,soft)*exp(-abs(h-.19)*12.)*(1.-night*.85);c=mix(c,vec3(.49,.17,.31),haze*.30);c+=stars*night*.38;
 gl_FragColor=vec4(mix(c,sunColor,disc*(1.-stripes*.65)),1.);
#include <colorspace_fragment>
}` }));scene.add(sky);
  const hemi=new T.HemisphereLight(night?'#a9b9ed':'#ffeadf',night?'#59436c':'#a7769e',night?1.38:1.62);scene.add(hemi);
  const sun=new T.DirectionalLight(night?'#c8c8ff':'#ffd5a8',night?1.15:1.81);sun.position.set(100,155,-100);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-58;sun.shadow.camera.right=58;sun.shadow.camera.bottom=-58;sun.shadow.camera.top=58;sun.shadow.camera.far=235;sun.shadow.bias=-.00023;sun.shadow.normalBias=.09;scene.add(sun,sun.target);
  function frondGeometry(){
    const v=[];const t=(a,b,c)=>v.push(...a,...b,...c);const spine=u=>[0,.28*Math.sin(Math.PI*u)-.38*u*u,2.95*u];
    for(let i=0;i<13;i++){
      const u=i/13,q=(i+1)/13, a=spine(u),b=spine(q), w=.56*Math.sin(Math.PI*(.13+u*.87))+.014;
      t(a,b,[.033,b[1],b[2]]);t(a,[.033,b[1],b[2]],[.037,a[1],a[2]]);
      for(const side of [-1,1]){
        const tip=[side*w,a[1]-.17*w,a[2]+.46*(1-u)+.12], mid=[side*w*.55,a[1]+.006,a[2]+.21+.12*u];
        t(a,tip,mid);t(mid,tip,b);
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();return g;
  }
  const geometry={frond:frondGeometry(),column:new T.CylinderGeometry(.5,.5,1,16),asphalt:new T.BoxGeometry(),facade:new T.BoxGeometry(),glass:new T.BoxGeometry(),box:new T.BoxGeometry(),cyl:new T.CylinderGeometry(.48,.55,1,8),leaf:new T.SphereGeometry(.5,6,3),tri:new T.ConeGeometry(.6,1,4)};
  const groups=new Map(), blocks=[],props=[],segments=[];
  const solid=(x,z,w,d,yaw=0)=>props.push({x,z,w,d,yaw,camera:false});
  const angles=new T.Euler(), pos=new T.Vector3(), scale=new T.Vector3(), q=new T.Quaternion(), matrix=new T.Matrix4();
  function put(c,x,y,z,w,h,d,kind='box',rx=0,ry=0,rz=0,em=false,shadow=true){
    const tileX=Math.floor(x/112),tileZ=Math.floor(z/112),wide=w>70||d>70||h>85;const sector=wide?'wide':`${tileX}:${tileZ}`;const key=`${kind}:${em}:${shadow}:${sector}`;if(!groups.has(key))groups.set(key,{kind,matrices:[],colors:[],em,shadow,tileX,tileZ,wide});const group=groups.get(key);
    angles.set(rx,ry,rz);q.setFromEuler(angles);matrix.compose(pos.set(x,y,z),q,scale.set(w,h,d));group.matrices.push(matrix.clone());group.colors.push(new T.Color(c));
  }
  const ground=(c,x,z,w,d,y,kind='box')=>put(c,x,y-.035,z,w,.07,d,kind,0,0,0,false,false);
  ground('#6e5e78',-120,29,700,700,-.06); ground('#c9968d',233,28,47,701,-.16); ground('#9e697c',220,28,13,691,.085);
  ground(night?'#3d3e73':'#897fb3',451,0,408,1000,-.24);ground(night?'#5b557f':'#a18ab3',263,0,18,646,-.2);
  const ocean=new T.Mesh(new T.PlaneGeometry(410,1000),new T.ShaderMaterial({fog:false,uniforms:{clock:{value:0},night:{value:night?1:0}},vertexShader:`varying vec3 p;void main(){p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float clock,night;varying vec3 p;void main(){float d=distance(cameraPosition.xz,p.xz);float f=exp(-d*.005);float wav=sin(p.x*.84+sin(p.z*.18+clock*.42)*1.8-clock*1.7);float ripple=pow(max(0.,wav),12.)*(.4+.6*sin(p.z*2.1+p.x*.2+clock)*.5);float foam=exp(-abs(p.x-254.5-sin(p.z*.31-clock*.62)*.8)*.7);vec3 base=mix(vec3(.29,.22,.39),vec3(.109,.091,.221),night);vec3 horizon=mix(vec3(.52,.27,.38),vec3(.15,.104,.25),night);vec3 c=mix(horizon,base,f);c+=f*(ripple*.069+foam*.16)*vec3(1.,.73,.88);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`}));ocean.rotation.x=-Math.PI/2;ocean.position.set(459,-.212,0);scene.add(ocean);
  for(let i=0;i<200;i++){let x=260+random()*190,z=(random()-.5)*748;put(i%2?'#aa9dc4':'#829fc5',x,-.197,z,1+random()*6,.005,.07+random()*.14,'box',0,0,0,false,false);}
  const left=XS[0],bottom=ZS.at(-1),north=ZS[0],midZ=(north+bottom)/2,spanZ=bottom-north+22;
  ground('#a18b9c',(left+211)/2,midZ,211-left+43,spanZ+18,-.065);
  for(const x of XS){ground('#373451',x,midZ,17,spanZ,.01,'asphalt'); for(let z=north;z<bottom+3;z+=7.5) ground('#d2a494',x,z,.16,2.75,.025);ground('#9c859b',x-7.65,midZ,.13,spanZ-4,.026);ground('#9c859b',x+7.65,midZ,.13,spanZ-4,.026);}
  for(const z of ZS){ground('#373451',(left+204)/2,z,204-left+23,17,.014,'asphalt');for(let x=left;x<212;x+=7.5) if(XS.every(a=>Math.abs(a-x)>9)) ground('#d2a494',x,z,2.75,.16,.026);}
  for(const x of XS) for(const z of ZS) for(let i=0;i<8;i++){ground('#e0b8bf',x-5.7+i*1.62,z+8,.78,1.75,.032);ground('#e0b8bf',x+8,z-5.7+i*1.62,1.7,.78,.031);}
  const palette=['#bb809e','#e4a196','#b1a0cc','#d4a9a8','#8e98be','#b4a9c6','#dca38e','#89a8b2'];
  function sign(text,x,y,z,w=10,h=1.6,angle=0, tint='#ffa6c7'){
    const can=document.createElement('canvas');can.width=256;can.height=64;const ctx=can.getContext('2d');ctx.fillStyle='#302141';ctx.fillRect(0,0,256,64);ctx.strokeStyle=tint;ctx.lineWidth=3;ctx.strokeRect(3,3,250,58);ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=tint;ctx.fillText(text,128,33,238);
    const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=angle;scene.add(mesh);
  }
  function palm(x,z,h){
    solid(x+h*.012,z,.49,.49);
    const lean=h*.083;put('#785c75',x+lean*.5,h*.48,z,.43,h,.43,'cyl',0,0,-.087);
    for(let i=1;i<8;i++)put('#a0808b',x+lean*i/8,h*i/8,z,.445,.072,.445,'cyl',0,0,-.087);
    put('#664c62',x+lean,h-.13,z,.64,.64,.65,'leaf');
    for(let k=0;k<9;k++){const a=k*Math.PI*2/9 + z*.15;const tint=['#266866','#36766f','#3b7773','#255563'][k%4];put(tint,x+lean,h-.04,z,1.15,1.18,.93+(k%3)*.14,'frond',k%2?.19:-.105,a,k%3*.09,false,false);}
  }
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
  const gctx=glowCanvas.getContext('2d'), fade=gctx.createRadialGradient(32,32,1,32,32,31);fade.addColorStop(0,'rgba(255,223,169,.57)');fade.addColorStop(.19,'rgba(255,158,166,.22)');fade.addColorStop(.53,'rgba(248,119,160,.05)');fade.addColorStop(1,'rgba(248,119,160,0)');gctx.fillStyle=fade;gctx.fillRect(0,0,64,64);
  const glowTex=new T.CanvasTexture(glowCanvas);glowTex.colorSpace=T.SRGBColorSpace;
  const glowMat=new T.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:night?.82:.42});
  function lamp(x,z,side){solid(x,z,.24,.24);if(x>190){const halo=new T.Sprite(glowMat);halo.position.set(x+side*1.05,3.99,z);halo.scale.setScalar(night?3.45:2.0);scene.add(halo);}put('#493849',x,2.05,z,.16,4.1,.17,'cyl');put('#493849',x+side*.52,4.05,z,1.18,.12,.13);put('#ffd2a3',x+side*1.05,3.99,z,.55,.13,.34,'box',0,0,0,true);}
  function bench(x,z,ry=0){solid(x,z,2.25,.78,ry);put('#885d73',x,.51,z,2.25,.14,.65,'box',0,ry,0);put('#9f7285',x,.83,z-.23,2.25,.4,.14,'box',0,ry,0);put('#52465c',x-.75,.24,z,.14,.46,.55);put('#52465c',x+.75,.24,z,.14,.46,.55);}
  const shopNames=['AURORA','PALM COURT','VIOLETA','HOTEL SOL','CAFÉ SEREIA','CLUBE LÚMEN','MIRAMAR','MARÉ MOTEL'];
  function building(x,z,w,d,h,col,variant,name){
    blocks.push({x,z,w,d}); const trim=new T.Color(col).lerp(new T.Color('#fcedde'),.37);
    put(col,x,h/2+.13,z,w,h,d,'facade');put(trim,x,h+.25,z,w+.7,.49,d+.7);put(col,x,h+.57,z,w*.75,.65,d*.75);
    if(variant===0){put(trim,x,h+1,z-d*.21,w*.28,1.55,d*.51);put(col,x,h+2.0,z-d*.21,w*.19,.65,d*.34);}
    for(let fl=0;fl<Math.floor(h/2.65);fl++){
      const y=1.65+fl*2.65;const tint=fl===0||random()>.6?(night?'#b3829f':'#6a597a'):'#484c75';
      if(variant===1){put(tint,x,y,z+d/2+.025,w*.88,1.05,.085,'glass');put(tint,x+w/2+.028,y,z,.08,1.05,d*.84,'glass');}
      else {for(let j=-1;j<=1;j++)put(tint,x+j*w*.28,y,z+d/2+.025,w*.20,1.2,.09,'glass');for(let j=-1;j<=1;j++)put(tint,x+w/2+.03,y,z+j*d*.29,.09,1.2,d*.19,'glass');}
      if(fl>0&&(variant===0||variant===2))put(trim,x,y-.74,z+d/2+.13,w+.16,.13,.32);
      for(let j=-1;j<=1;j++){
        const xw=x+w/2+.057,zw=z+j*d*.29;const lit=(fl+j+Math.floor(z))%4===0;
        if(lit)put(night?'#fbc5a2':'#dc9cb5',xw,y,zw,.036,.93,d*.15,'box',0,0,0,night,false);
        if(variant!==1){put(trim,xw,y+.15,zw,.055,1.2,.08);put(trim,xw,y-.44,zw,.18,.059,d*.19);}
      }
    }
    if(variant!==1){for(const k of [-1,1])put(trim,x+k*w*.43,h/2+.13,z+d/2+.12,.28,h,.32);}
    if(name){const glow=random()>.5?'#ffa2ce':'#9bebe5'; if(x>120)sign(name,x+w/2+.06,Math.min(5,h-.52),z,Math.min(d*.8,12),1.25,Math.PI/2,glow); sign(name,x,2.9,z+d/2+.20,Math.min(w*.7,10),1.4,0,glow);put(glow,x,3.94,z+d/2+.09,w*.96,.09,.2,'box',0,0,0,true);put('#404568',x,1.02,z+d/2+.04,2.1,2,.12);put(glow,x+w/2+.08,3.94,z,.18,.09,d*.96,'box',0,0,0,true);
      if(x>120){
        for(const zz of [-d*.43,d*.43]){
          put(trim,x+w/2+.10,1.31,z+zz,.41,2.61,.44,'column');
          put(glow,x+w/2+.11,2.64,z+zz,.42,.064,.42,'column',0,0,0,true,false);
          put('#625577',x+w/2+.11,.14,z+zz,.54,.22,.55,'column');
        }
        put(new T.Color(col).lerp(new T.Color('#ae8dad'),.5),x+w/2+.082,.37,z,.2,.42,d*.88);
        for(let k=0;k<3;k++)put(k===0?'#ffc79a':glow,x+w/2+.213,3.11-k*.23,z,.24,.043,d*.91,'box',0,0,0,true,false);
        for(let i=0;i<7;i++){put(i%2?'#f9b9ad':'#95548b',x+w/2+.72,2.83,z+(i-3)*1.16,1.5,.15,1.16,'box',0,0,-.14);}
        for(const zz of [-d*.30,d*.30]){put('#585472',x+w/2+.1,1.41,z+zz,.14,2.65,2.7);put(night?'#a97eab':'#a185ba',x+w/2+.172,1.42,z+zz,.055,2.1,2.2);
          put('#402e54',x+w/2+.204,1.45,z+zz,.061,2.16,.081);
          put('#f1c7c0',x+w/2+.20,2.28,z+zz,.071,.045,2.01);
          put('#e4b6cf',x+w/2+.18,1.58,z+zz-.44,.05,.075,1.1,'box',.53);}
      }
    }
  }
  for(let ix=0;ix<XS.length-1;ix++) for(let iz=0;iz<ZS.length-1;iz++){
    const x=(XS[ix]+XS[ix+1])/2,z=(ZS[iz]+ZS[iz+1])/2;ground(ix<2?'#779095':iz>=9?'#987891':ix>=8?'#a5879c':'#988598',x,z,48.5,48.5,.12);
    const plaza=((ix-2)+iz*3)%11===4|| (ix===XS.length-2&&[1,6].includes(iz));
    const civic=(x< -455 || z>360);
    if(x< -650&&z>72){
      ground('#678278',x,z,49,49,.14);ground('#456a72',x-4,z+6,28,37,.154);ground('#b69081',x+13,z,3.4,48,.20);ground('#b69081',x,z-13,40,2.2,.201);
      for(let i=0;i<8;i++){const px=x-17+i*4.7,pz=z+Math.sin(i*2.1)*13;if(i%2===0)palm(px,pz,4.9+i*.25);else put('#48796e',px,.68,pz,4.1,1.25,3.8,'leaf');}
      if(iz%2===0){bench(x+11,z+11,.45);building(x+17,z+15,4.3,5.6,3.15,'#ad8f7d',1,null);}
      if(iz===8)sign('RESERVA DAS GARÇAS',x+12,2.05,z+22,7.4,.84,0,'#a8dfc3');
    }else if(z>490&&x>-210){
      ground('#798a8a',x,z,49,48,.14);ground('#ba9693',x,z,43,3.8,.161);ground('#ba9693',x,z,3.8,43,.16);
      for(const xx of [-1,1])for(const zz of [-1,1]){
        ground(zz===xx?'#5a8a86':'#738b82',x+xx*12,z+zz*13,15,16,.15);
        for(let j=0;j<3;j++)palm(x+xx*(10+j*2.9),z+zz*(8+(j%2)*5),5.2+j*.42);
        bench(x+xx*6,z+zz*16,xx*.25);
      }
      if(ix%2===0){put('#9d7782',x,.3,z,7.5,.31,7.5,'column');put('#71a7a5',x,.44,z,6.4,.14,6.4,'column');}
    }else if(civic&&x< -455&&z<65){
      ground('#777786',x,z,48,45,.14);for(const v of [-13,11]){building(x+v,z-7,17,26,5.2,v<0?'#8b9c9d':'#b68784',2,null);put('#705a70',x+v,5.85,z-7,15,.33,19);}
      for(const v of [-14,-8,-2,4,10]){put('#a77977',x+v,1.12,z+15,5.6,2.1,2.6);for(let k=-2;k<=2;k++)put('#ba9a94',x+v+k*.96,1.10,z+16.33,.12,1.97,.086);solid(x+v,z+15,5.61,2.64);}
      if(iz%2===0)sign('ARMAZÉNS VIOLETA',x,3.0,z+24,8,.88,0,'#ecc4a9');
    } else if(civic&&(ix+iz)%3!==0){
      ground('#789288',x,z,48.6,49,.141);for(const q of [-1,1])for(const v of [-1,1]){const cx=x+q*14,cz=z+v*13;building(cx,cz,8.7,10.6,3.65,q<0?'#cfb39d':'#cca3aa',v<0?0:2,null);ground('#b49fa4',cx,cz+9,3.4,7,.156);palm(cx-2.85,cz+9,4.55);}
      ground('#ad939d',x,z,3.8,46,.156);bench(x+2.5,z+6);
      if(iz===8||iz===11)sign(z>360?'DOCA SUL':'JARDIM DAS PALMEIRAS',x,2.4,z+23,8,.91,0,'#bce7d5');
    } else if(plaza){ground(ix<2?'#59857c':'#637e83',x,z,39,39,.14);ground('#bda3ad',x,z,3,39,.16);ground('#bda3ad',x,z,39,3,.16);for(const a of [-1,1])for(const b of [-1,1])palm(x+a*14,z+b*14,5+random()*2);bench(x-4,z+8);bench(x+4,z-8);put('#cf9eae',x,.22,z,6,.3,6,'cyl');put('#6696ae',x,.39,z,4.9,.06,4.9,'cyl');}
    else for(let a=0;a<2;a++) for(let b=0;b<2;b++){
      const h=4+random()*(ix<4&&iz<5?28:11);const w=16+random()*5,d=15+random()*6;
      let name=(ix>=8&&a===1&&b===1)?shopNames[(ix+iz)%shopNames.length]:null;
      if(XS[ix]===-60&&ZS[iz]===30&&a===0&&b===1)name='CAFÉ SEREIA';
      if(XS[ix]===-126&&ZS[iz]===-102&&a===0&&b===0)name='CLUBE LÚMEN';
      building(x+(a-.5)*23,z+(b-.5)*23,w,d,h,palette[Math.floor(random()*palette.length)],(a+b+ix+iz)%4,name);
    }
    palm(x-22,z+22,5.4+random()*2);lamp(x+20.5,z+22,1);
  }
  // A street-to-roof landmark that survives the prologue in every mode.
  const {x:cx,y:cy,z:cz}=casinoSite;
  blocks.push({x:cx,z:cz,w:10.6,d:23});
  put('#5e4661',cx,cy*.5-.28,cz,10.6,cy-.56,23,'facade');
  for(const side of [-1,1]){
    put('#966f77',cx+side*5.28,cy*.5,cz,.48,cy,21.8,'facade',0,0,0,false,false);
    put('#e8a8a2',cx+side*5.64,cy*.5,cz-9.82,.13,cy,.23,'box',0,0,0,true,false);
    put('#4d4155',cx+side*3.49,cy*.49,cz+side*11.61,.54,cy*.97,.31,'facade');
  }
  for(let h=6;h<cy-3;h+=5.15){
    for(const side of [-1,1]){
      put('#5b6076',cx+side*5.43,h,cz,.22,2.05,19.7,'glass',0,0,0,false,false);
      put('#9e7980',cx,h+.63,cz+side*11.57,9.2,.24,.22,'box',0,0,0,false,false);
      for(let cut=-7;cut<=7;cut+=3.5)put((h+cut)%4>1?'#ad8292':'#f8c1a0',cx+side*5.56,h+.25,cz+cut,.033,.096,1.65,'box',0,0,0,(h+cut)%4<1,false);
    }
  }
  for(let h=9;h<=cy;h+=32)put('#b48b8a',cx,h,cz,11.7,.69,24.1,'facade');
  put('#71546a',cx,cy-.29,cz,12.4,.42,25.4);put('#34273e',cx,2.2,cz,11.1,4.4,23.7,'facade');
  sign('CASINO MIRAGEM',cx,4.28,cz-11.96,9.4,1.3,Math.PI,'#f9c399');
  sign('MIRAGEM',cx,cy-4.6,cz+11.57,8.6,1.65,0,'#f6adbd');
  function planter(x,z){
    solid(x,z,1.39,3.15);put('#e3a4b0',x,.51,z,1.45,.07,3.19);
    for(const q of [-1,1])put('#67536e',x+q*.67,.37,z,.043,.13,2.9);
    put('#a68298',x,.29,z,1.38,.48,3.14);put('#684f65',x,.545,z,1.22,.05,2.95);
    for(let j=0;j<5;j++){put(j%2?'#4b7e77':'#6c8783',x+Math.sin(j)*.27,.68+random()*.24,z+(j-2)*.55,.63,.62,.84,'leaf',0,j*.45,.2);if(j%2)put('#e789ac',x+Math.sin(j)*.34,.96,z+(j-2)*.55,.21,.27,.25,'leaf');}
  }
  for(let z=-285;z<300;z+=22){
    const x=219.3;ground('#b992a0',x,z,6.9,20.1,.101);if(z%2){planter(221.7,z+4);}
    for(const sign of [-1,1])ground('#d9a7a6',x+sign*2.9,z,.21,20.1,.121);
  }
  for(let z=-299;z<303;z+=5){if((z+299)%25===10||Math.abs(z+219)<3||Math.abs(z-65)<3)continue;solid(225.4,z+2.5,.22,4.9);put('#9b829b',225.4,.53,z,.14,.88,.14);put('#be9ba9',225.4,.86,z+2.5,.12,.09,5.07);put('#b695a5',225.4,.49,z+2.5,.09,.065,5.07);}
  function kiosk(x,z,name,c,trim){
    for(const i of [-1,1]){put('#4e3559',x+i*2.27,1.34,z+2.57,.28,2.55,.25,'column');put(trim,x+i*2.27,.46,z+2.57,.36,.12,.35,'column');}
    put('#deab9e',x,.15,z,6.7,.23,7);put(c,x,1.41,z,4.9,2.65,5.3);put('#6c4968',x,1.77,z+2.662,3.6,1.24,.066);put('#976b81',x-2.47,1.64,z,.07,1.03,3.5);put(trim,x,1.19,z+2.94,4.1,.15,.77);
    for(let i=0;i<8;i++)put(i%2?trim:c,x+(i-3.5)*.62,2.62,z+3.19,.62,.10,1.65,'box',.13);
    put(trim,x,2.85,z,5.26,.39,5.57);put('#8b6680',x,3.1,z,4.72,.12,4.66);sign(name,x,2.88,z+2.796,4.5,.93,0,'#ffc4c1');
    for(const s of [-1,1]){put('#624963',x+s*1.72,.5,z+3.57,.15,.89,.15,'cyl');put(trim,x+s*1.72,.98,z+3.57,.61,.09,.61,'cyl');}
    blocks.push({x,z,w:4.9,d:5.3});
  }
  kiosk(222.6,33.8,'QUIOSQUE 06','#974b79','#ebb195');kiosk(230.4,-219,'VIOLETA','#765b94','#c8a5bc');kiosk(222,214,'SOUTH POINT','#7fa2a7','#f8b69b');
  for(let z=-302;z<=308;z+=14){palm(219+(z%3),z,6.3+random()*3.3);if(z%28===6)lamp(214,z,-1);if(z%3===1)bench(225,z);}
  for(let z=-284;z<289;z+=48){const x=236+random()*7;put('#9d788b',x,1,z,.13,2,.13,'cyl');put(z%2?'#f5a4b2':(z%3?'#ef9eab':'#e3b693'),x,2.05,z,3.35,.68,3.35,'tri');put('#c67f9c',x-3,.12,z+1,1.2,.16,2.6,'box',0,.24,0);}
  for(const z of [-248,-222,-196]){ground('#88617b',260,z,36,5,.12);for(let x=245;x<=277;x+=8){put('#d6a1af',x,.54,z-2.38,.16,.9,.16);put('#d6a1af',x,.54,z+2.38,.16,.9,.16);}put('#e0becd',272,.04,z+4,3,.52,8,'leaf');put('#637392',272,.39,z+4,1.75,.52,3,'box');}
  // The low rental pier borders both the walking area and the simulated water.
  ground('#956e76',249.6,jetskiDock.z-1.85,18.8,4.0,.143);
  for(let x=241;x<259;x+=2.4){put('#c2948b',x,.24,jetskiDock.z-3.61,.14,.31,.14);put('#846374',x,-.09,jetskiDock.z-3.42,.28,.56,.28);}
  for(const z of [jetskiDock.z-3.8,jetskiDock.z+.04]){put('#f4c5a1',244.5,.25,z,.16,.54,.16);put('#dd95a5',244.5,.58,z,.19,.10,.18,'box',0,0,0,true);}
  sign('JET SKI · ALUGUEL',244.4,2.07,jetskiDock.z-3.7,4.85,.67,0,'#a9ecd9');
  sign('OCEAN DRIVE',214,3.1,26,5,.95);put('#725c77',214,1.3,26,.16,2.6,.16);sign('PORTO VIOLETA',239,3,-218,7,1.35);put('#725c77',239,1.3,-218,.18,2.6,.18);
  sign('MIRAMAR',-165,3.3,171,6,1.25);sign('DISTRITO ART DÉCO',-112,3.3,-96,8,1.25);
  // Ocean Beach is a boardwalk, not another city block: arcades, food stands, bustle and color.
  kiosk(wardrobe.buildingX,wardrobe.buildingZ,'VESTIÁRIO NEON','#613f8f','#ff9ab9');
  sign('VESTIÁRIO NEON',218.13,2.13,78.8,3.9,.81,-Math.PI/2,'#ffaac7');
  put('#352445',218.19,1.10,78.75,.087,1.94,1.67);put('#ecc1bc',218.11,1.09,79.28,.116,.12,.15);
  put('#b59abc',218.06,.65,77.10,.099,.94,.56);put('#fda0d1',217.99,.78,77.10,.06,.13,.30,'box',0,0,0,true,false);
  for(let j=0;j<3;j++)put(j===1?'#a2e8d3':'#ff98c1',218.14,2.9-j*.14,78.8,.16,.043,4.7,'box',0,0,0,true,false);
  kiosk(220,65,'PIXEL PÍER','#744f95','#83d1bc');kiosk(237,99,'COSTA FM','#438d9b','#f4cf9f');
  sign('DISCOS NA AREIA',222.9,2.1,85,4.4,.8,0,'#ffb6d5');sign('VALET LÚMEN',-115,2.4,-110,4.5,.9,0,'#9cebd8');
  function umbrella(x,z,tint){
    solid(x,z,1.11,1.11);
    put('#cbafba',x,1.1,z,.072,2.2,.072,'cyl');put(tint,x,2.14,z,3.4,.53,3.4,'cyl');put('#f6c9b3',x,2.34,z,2.13,.15,2.13,'cyl');
    put('#ce8dad',x,.86,z,1.38,.03,1.38,'cyl');put('#a07ca1',x,.81,z,1.34,.09,1.34,'cyl');put('#62445c',x,.4,z,.14,.79,.14,'cyl');
    for(const q of [-1,1]){put('#874f7a',x+q*.98,.47,z,.43,.09,.49);put('#5e4760',x+q*.98,.27,z,.08,.5,.08,'cyl');}
  }
  for(const [x,z] of [[222,55],[220,45],[222,79],[219,87],[235,104],[242,94],[242,72],[219,-19],[220,183],[223,-178],[236,-225],[-51,89]])umbrella(x,z,z%3===0?'#db6c9a':z%2===0?'#83bcba':'#d69885');
  for(const [x,z] of [[213.5,52],[218,87],[223.7,70],[216,20],[225,-190],[216,111],[-50.7,79],[-111,-97]]){
    solid(x,z,.55,.55);put('#5e3c65',x,.42,z,.54,.81,.53,'cyl');put('#aa90ac',x,.86,z,.58,.12,.58,'cyl');
  }
  for(let z=-284;z<342;z+=22){
    for(let j=0;j<5;j++){ground(j%2?'#e3abb0':'#b47698',220,z+j*1.6,6.4,.08,.128);}
    if(z%3===0){put('#558680',223.3,.61,z,.86,1.14,.48);put('#83e6ca',223.3,1.13,z,.64,.1,.52,'box',0,0,0,true,false);}
  }
  for(let x=214;x<252;x+=3.1){let z=58+Math.cos(x*.82)*2.2;put('#815b79',x,3.31,z,.08,6.6,.08,'cyl');for(let j=0;j<5;j++){const a=x+j*.59;put(j%2?'#ffdab2':'#f59bbb',a,6.44+.12*(j-2)**2,z,.13,.14,.12,'leaf',0,0,0,true,false);}}
  for(const z of [-250,-184,-118,-52,14,80,146,212,278,344]){
    lamp(212.7,z,-1);lamp(195.1,z+13,1);
    solid(211.9,z-10,.22,.22);put('#4e425e',211.9,2.55,z-10,.14,5.1,.14,'cyl');put('#3f3851',209.4,4.95,z-10,5.05,.1,.13);
    for(const x of [207.4,210.8]){put('#49374e',x,4.74,z-10,.38,.53,.24);put(x>209?'#ff8e99':'#91eace',x,4.64,z-9.86,.17,.12,.03,'box',0,0,0,true,false);}
  }
  ground('#806282',237,-207,26,31,.121);
  for(let x=225;x<251;x+=2.4)ground('#ae81a0',x,-211,.08,28,.134);
  for(let z=-226;z<-190;z+=3.2)ground('#9c7897',237,z,27,.08,.135);
  for(const [x,z] of [[231,-230],[235,-195],[243,-206],[244,-231],[231,-206]]){planter(x,z);if(x%2)bench(x+2,z+1.6);}
  for(let i=0;i<9;i++){let z=-243+i*3.6;put('#81546f',253,.64,z,.19,1.07,.19);put('#c4a0ab',253,1.12,z+1.8,.15,.10,3.65);if(i%2===0)put('#f6a5c8',253,1.21,z,.19,.11,.18,'box',0,0,0,true,false);}
  ground('#865777',245,-244,18,37,.13);ground('#9d6c85',245,-250,17.8,13,.151);sign('RODA VIOLETA',245,3.4,-239,7.8,1.37,0,'#ffacd2');
  const wheel=new T.Group();wheel.position.set(247,10.8,-258);scene.add(wheel);
  const wheelMat=new T.MeshBasicMaterial({color:'#ec8bc2'}),wheelAlt=new T.MeshBasicMaterial({color:'#8ceadd'}), beamMat=new T.MeshStandardMaterial({color:'#77568b',roughness:.75});
  const outer=new T.Mesh(new T.TorusGeometry(8.2,.12,6,52),wheelMat);wheel.add(outer);
  const inner=new T.Mesh(new T.TorusGeometry(7.75,.076,6,52),wheelAlt);wheel.add(inner);
  const gondolas=[];
  function beam(a,b,width,material,parent){const one=new T.Vector3(...a),two=new T.Vector3(...b),delta=two.clone().sub(one);const mesh=new T.Mesh(new T.BoxGeometry(width,delta.length(),width),material);mesh.position.copy(one.addScaledVector(delta,.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(mesh);return mesh;}
  for(const [x,z] of [[241,-255],[253,-255],[241,-262],[253,-262]])beam([x,.13,z],[247,10.8,-258],.46,beamMat,scene);
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,x=8.16*Math.cos(a),y=8.16*Math.sin(a);beam([0,0,0],[x,y,0],.075,i%2?wheelMat:wheelAlt,wheel);
    const g=new T.Group();g.position.set(x,y,0);wheel.add(g);gondolas.push(g);const cab=new T.Mesh(new T.BoxGeometry(.96,.48,.72),i%2?wheelMat:wheelAlt);cab.position.y=-.37;g.add(cab);
  }
  // Painted parking lines and sea-facing path panels read clearly at driving speed.
  for(let z=-285;z<353;z+=8.85){ground('#a487a0',210.5,z,2.9,.09,.037);ground('#92829e',211.2,z+3.1,.095,5.9,.038);}
  for(const [x,z] of [[215,43],[218,121],[216,-95],[226,-234],[218,204]]){
    put('#493957',x,.54,z,.66,1.06,.64);put('#ff9b9f',x,.88,z+.33,.42,.15,.038,'box',0,0,0,true,false);put('#69516c',x,1.12,z,.74,.14,.7);
  }
  sign('ALFÂNDEGA',-313,3.7,-230,7.5,1.4);sign('VILA MANGUE',-382,3.7,159,7.5,1.4,0,'#9cebd8');sign('TERMINAL SUL',-111,3.7,351,7.5,1.4);
  const paintedRoad=material=>{
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vRoad;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vec4 instancePos=vec4(transformed,1.);
        #ifdef USE_INSTANCING
        instancePos=instanceMatrix*instancePos;
        #endif
        vRoad=(modelMatrix*instancePos).xyz;`);
      shader.fragmentShader=`varying vec3 vRoad;
        float marHash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
        float marNoise(vec2 q){vec2 i=floor(q),u=fract(q);u=u*u*(3.-2.*u);return mix(mix(marHash(i),marHash(i+vec2(1.,0.)),u.x),mix(marHash(i+vec2(0.,1.)),marHash(i+1.),u.x),u.y);}
      `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec2 p=vRoad.xz;
        float aggregate=marNoise(p*12.);
        float patches=marNoise(p*vec2(.21,.52));
        float tracks=marNoise(p*vec2(2.7,.085));
        diffuseColor.rgb*=.80+aggregate*.19+patches*.19+tracks*.12;
        float edge=exp(-abs(p.x-208.)*.31);
        float spill=exp(-pow(mod(p.y-3.+14.,28.)-14.,2.)*.023);
        float streak=clamp(marNoise(p*vec2(4.,.51))+.21*aggregate,0.,1.);
        diffuseColor.rgb+=edge*spill*streak*vec3(.081,.017,.052);
        float distant=smoothstep(.63,1.,patches)*max(0.,1.-abs(p.x-204.)*.09);
        diffuseColor.rgb+=distant*vec3(.048,.025,.034);`);
    };
  };
  // Distinct waterfront stops with awnings, stock, furniture and physical footprints.
  function crates(x,z,theme){
    for(let i=0;i<2;i++){
      const y=.30+i*.39,xx=x+i*.10;put('#47394b',xx,y,z,.70,.39,.60);put(theme,xx,y+.19,z,.72,.06,.61);
      for(const s of [-1,1]){for(const e of [-1,1])put('#a67e7a',xx+s*.32,y,z+e*.29,.058,.42,.064);put('#ad8580',xx,y+.01,z+s*.297,.66,.07,.028);}
    }
    solid(x+.04,z,.83,.66);
  }
  {
    const s=streetSpots[0],x=s.x+1.87,z=s.z;
    kiosk(x+.59,z,'PRAIA HI-FI','#785094','#e7a6bc');
    sign('PRAIA HI-FI',x-1.93,2.38,z,4.6,.89,-Math.PI/2,'#ffb4dd');
    const j=x-2.43;
    put('#3a2546',j,.73,z, .55,1.30,1.00);put('#b85987',j-.035,1.41,z,.58,.39,.98,'cyl',0,0,Math.PI/2);put('#f59ab7',j-.28,1.22,z,.081,.20,.86,'box',0,0,0,true,false);
    put('#40335b',j-.289,.83,z,.06,.33,.64);put('#b9efd7',j-.327,.89,z,.035,.14,.51,'box',0,0,0,true,false);
    for(let k=-4;k<=4;k++)put('#8c728a',j-.33,.49+k*.031,z,.034,.013,.66);
    solid(j,z,.62,1.04);
    for(const q of [-1,1]){crates(x-1.9,z+q*3.4,q<0?'#d98fb5':'#a5c8c1');put('#8bc6b2',x-.57,.06,z+q*3.6,2.7,.05,1.32);}
  }
  {
    const s=streetSpots[1],x=s.x+3.5,z=s.z;
    kiosk(x,z,'CAFÉ NA JANELA','#956055','#ffd0a8');sign('CAFÉ NA JANELA',x-2.522,2.00,z,4.34,.84,-Math.PI/2,'#ffc6a1');
    put('#4a3956',x-2.50,1.50,z,.08,.97,2.8);put('#c9a699',x-2.68,1.05,z,.41,.096,2.95);
    for(let i=-2;i<=2;i++){const c=i%2?'#a5d4c3':'#ffe9d1';put(c,x-2.60,1.16,z+i*.32,.143,.16,.143,'column');put('#734752',x-2.60,1.25,z+i*.32,.153,.023,.153,'column');}
    for(const zz of [-4,4])umbrella(x-1.9,z+zz,'#b56881');
  }
  {
    const s=streetSpots[2],x=s.x+3.4,z=s.z;
    kiosk(x,z,'MERCADO DO PORTO','#517c86','#dbbf9d');sign('MERCADO DO PORTO',x-2.52,2.15,z,4.3,.82,-Math.PI/2,'#b5ecd7');
    put('#5f4e61',x-2.68,.85,z,.42,.93,2.14);put('#b09088',x-2.86,1.32,z,.63,.072,2.3);solid(x-2.65,z,.54,2.15);
    for(const j of [-1,0,1]){
      put('#7d9d9e',x-2.90,1.38,z+j*.66,.36,.09,.54);for(let f=-1;f<=1;f++)put(f===0?'#e0cbbc':'#b4b8c2',x-2.91+f*.10,1.45,z+j*.66,.096,.055,.39,'leaf',0,.31,0);
    }
    for(const zz of [-4,4])crates(x-1.6,z+zz,'#527b8a');
  }
  // Street-side parking meters, reflectors and planter material layers vary without extra draw calls.
  for(const z of [-147,-107,-16,13,47,137,175,194,244]){
    const x=212.95;solid(x,z,.26,.25);put('#564c63',x,.49,z,.09,.97,.09,'column');put('#9c8da2',x,1.02,z,.245,.30,.17,'box',0,.18,0);put('#463e5a',x-.132,1.07,z,.034,.108,.116);put('#ade4c8',x-.158,1.087,z,.018,.025,.069,'box',0,0,0,true,false);
  }
  for(const z of [-130,-64,2,134,200,266]){
    for(const dx of [0,.22])put(dx?'#beb2bb':'#776981',212.83+dx,.093,z,.15,.041,2.6,'box',0,0,0,false,false);
    put('#5d5065',213.84,.122,z-1,.57,.018,.34,'box',0,0,0,false,false);
  }
  // Shared home: room open toward the walkway, with a real collision opening.
  {
    const {x,z}=home;ground('#aa8094',x,z,7.2,8.8,.18);ground('#d09e9d',x,z,6.58,8.30,.20);
    for(let k=-4;k<=4;k++)put('#ae8294',x,.205,z+k*.875,6.52,.013,.046);
    put('#ca8795',x+3.4,1.46,z,.27,2.68,8.7);put('#d78e98',x,1.46,z-4.30,7,.27+2.41,.24);put('#d78e98',x,1.46,z+4.30,7,2.68,.24);
    const houseWalls=[[x+3.4,z,.27,8.7],[x,z-4.3,7,.24],[x,z+4.3,7,.24],[x-3.42,z-3.16,.25,2.26],[x-3.42,z+3.0,.25,2.58]];
    for(const [wx,wz,w,d] of houseWalls){blocks.push({x:wx,z:wz,w,d});}
    for(const zz of [-3.16,3.0])put('#b67589',x-3.42,1.48,z+zz,.25,2.7,zz<0?2.26:2.58);
    put('#6c536c',x,2.89,z,7.68,.21,9.24);put('#f8bd98',x-3.80,2.67,z,.105,.076,8.3,'box',0,0,0,true);
    put('#765968',x+1.58,.4,z-2.48,2.1,.35,2.86);put('#bfb1bf',x+1.57,.65,z-2.52,1.99,.21,2.73);put('#5e7e88',x+1.57,.79,z-2.25,2.01,.10,2.15);put('#efd0b6',x+1.57,.82,z-3.48,1.89,.20,.61);solid(x+1.57,z-2.48,2.11,2.87);
    put('#77526c',x+1.96,.56,z+2.57,.85,.77,2.15);put('#94839a',x+1.9,1.12,z+2.56,.57,.78,2.18);put('#e6a4aa',x+1.43,.76,z+2.0,.42,.27,.51,'leaf');solid(x+1.92,z+2.57,.91,2.2);
    put('#734c60',x-.37,.57,z+1.64,1.32,.08,.61);for(const xx of [-.89,.11])put('#573e57',x+xx,.33,z+1.65,.065,.45,.059);solid(x-.37,z+1.64,1.32,.61);
    put('#498b7d',x-1.7,.33,z-2.65,.48,.38,.45,'column');put('#87a993',x-1.7,.72,z-2.65,.56,.67,.45,'leaf');solid(x-1.7,z-2.65,.49,.48);
    sign('CASA LUZIA & DAVI',x-3.85,2.59,z,3.55,.57,-Math.PI/2,'#ffdec2');
  }
  // Small props yield to a bumper. Heavy furniture remains in the spatial collision index.
  const cones=[];
  for(const [x,z] of [[211.7,140],[211.9,137],[211.8,132],[211,104],[211.1,101],[211.5,98],[205.2,-61],[205.2,-64],[208,-190]]){
    const root=new T.Group(),mat=new T.MeshStandardMaterial({color:'#da826d',roughness:.86}),reflect=new T.MeshStandardMaterial({color:'#f8d9c0',emissive:'#794e49',emissiveIntensity:.18,roughness:.71});
    const shell=new T.Mesh(new T.CylinderGeometry(.035,.115,.34,14),mat),stripe=new T.Mesh(new T.CylinderGeometry(.064,.082,.070,14),reflect),foot=new T.Mesh(new T.BoxGeometry(.29,.052,.29),new T.MeshStandardMaterial({color:'#504558',roughness:.94}));
    shell.position.y=.193;stripe.position.y=.224;foot.position.y=.025;root.add(shell,stripe,foot);root.position.set(x,.08,z);scene.add(root);
    cones.push({root,vx:0,vz:0,tilt:0,hit:0});
  }
  function coatSurface(mat,glass){
    mat.customProgramCacheKey=()=>glass?'coast-glass-v1':'coast-stucco-v1';
    mat.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 coastWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec4 localSurface=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          localSurface=instanceMatrix*localSurface;
        #endif
        coastWorld=(modelMatrix*localSurface).xyz;`);
      shader.fragmentShader='varying vec3 coastWorld;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float detailFade=1.-smoothstep(21.,56.,distance(cameraPosition,coastWorld));
        ${glass?`vec3 sight=normalize(cameraPosition-coastWorld);
          float horizon=smoothstep(-.19,.56,sight.y);
          float ribbon=exp(-abs(fract(coastWorld.y*.38+(coastWorld.x+coastWorld.z)*.018)-.73)*16.);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.20,.29),.14+horizon*.19);
          diffuseColor.rgb+=detailFade*ribbon*vec3(.12,.08,.11);`:
          `vec3 cell=floor(coastWorld*28.);
          float grit=fract(sin(dot(cell,vec3(1.97,69.4,51.67)))*4375.52);
          float stain=.55+.45*sin(coastWorld.x*.51+coastWorld.z*.61)*sin(coastWorld.y*.92);
          diffuseColor.rgb*=mix(1.,.965+(grit-.5)*.14+stain*.075,detailFade);`}`);
    };
  }
  const surfaceMaterials=new Map();
  for(const {kind,matrices,colors,em,shadow,tileX,tileZ,wide} of groups.values()){
    const matKey=`${kind}/${em}`;let mat=surfaceMaterials.get(matKey);
    if(!mat){mat=em?new T.MeshBasicMaterial({color:0xffffff}):new T.MeshStandardMaterial({color:0xffffff,roughness:.91,side:kind==='frond'?T.DoubleSide:T.FrontSide});
    if(kind==='asphalt')paintedRoad(mat);
    if(kind==='facade'||kind==='glass'){if(kind==='glass'){mat.roughness=.36;mat.metalness=.23;}coatSurface(mat,kind==='glass');}
    surfaceMaterials.set(matKey,mat);}
    const mesh=new T.InstancedMesh(geometry[kind],mat,matrices.length); matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,colors[i]);}); mesh.castShadow=shadow&&!em;mesh.receiveShadow=!em;scene.add(mesh);if(!wide)segments.push({mesh,x:(tileX+.5)*112,z:(tileZ+.5)*112});
  }
  const collision=createCollision([...blocks,...props],{minX:XS[0]-13,maxX:257,minZ:ZS[0]-12,maxZ:ZS.at(-1)+12});
  function looseProps(dt,car,speed,heading){
    const shape=car&&carShape(car.x,car.z,heading);let touched=false;
    for(const c of cones){
      const p=c.root.position;c.hit=Math.max(0,c.hit-dt);
      if(shape&&c.hit===0&&Math.abs(speed)>.9&&Math.hypot(p.x-car.x,p.z-car.z)<3&&circleBox(p.x,p.z,.16,shape)){
        const dx=p.x-car.x,dz=p.z-car.z,m=Math.max(.25,Math.hypot(dx,dz));
        c.vx=dx/m*Math.min(5,Math.abs(speed)*.55)-Math.sin(heading)*speed*.27;
        c.vz=dz/m*Math.min(5,Math.abs(speed)*.55)-Math.cos(heading)*speed*.27;c.hit=.48;c.tilt=1.24;touched=true;
      }
      const damping=Math.exp(-dt*2.25);c.vx*=damping;c.vz*=damping;
      const x=p.x+c.vx*dt,z=p.z+c.vz*dt;
      if(collision.circle(x,p.z,.12))c.vx*=-.44;else p.x=x;
      if(collision.circle(p.x,z,.12))c.vz*=-.44;else p.z=z;
      c.root.rotation.z+=(c.tilt-c.root.rotation.z)*(1-Math.exp(-dt*9));c.root.rotation.y+=(c.vx+c.vz)*dt*.33;
    }
    return touched;
  }
  const dayTop=new T.Color('#57759e'),nightTop=new T.Color('#201a38'),dayLow=new T.Color('#ffd1b5'),nightLow=new T.Color('#775284'),nightFog=new T.Color('#625273'),dayFog=new T.Color('#dfb0b1'),gold=new T.Color('#ffcf9a'),blue=new T.Color('#abb7f0');
  function daylight(seconds){const {light,hours}=cityClock(seconds,night),u=sky.material.uniforms;
    u.top.value.copy(nightTop).lerp(dayTop,light);u.bottom.value.copy(nightLow).lerp(dayLow,light);u.night.value=1-light;u.sunColor.value.copy(blue).lerp(gold,light);
    u.sunDir.value.set(Math.cos(hours*Math.PI/12)*.62,Math.max(.10,light*.66),-.85).normalize();
    sun.intensity=.60+light*1.11;hemi.intensity=1.01+light*.65;sun.color.copy(blue).lerp(gold,light);hemi.color.copy(blue).lerp(dayLow,.34+light*.66);
    scene.fog.color.copy(nightFog).lerp(dayFog,light);ocean.material.uniforms.night.value=1-light;glowMat.opacity=.23+(1-light)*.53;
  }
  function lod(x,z,close){const range=close?240:330,r2=range*range;for(const o of segments)o.mesh.visible=(o.x-x)**2+(o.z-z)**2<r2;}
  return { lod, daylight, looseProps, collides:collision.circle, collidesVehicle:collision.vehicle, sky, sun, hemi, blocks, tide(time){ocean.material.uniforms.clock.value=time;wheel.rotation.z=time*.11;for(const g of gondolas)g.rotation.z=-wheel.rotation.z;} };
}
