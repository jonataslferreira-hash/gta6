import * as T from 'three';
export const XS=[-324,-258,-192,-126,-60,6,72,138,204], ZS=[-300,-234,-168,-102,-36,30,96,162,228,294];
export const districts=[{x:151,z:70,name:'Ocean Beach'},{x:114,z:-192,name:'Porto Violeta'},{x:-152,z:-133,name:'Distrito Art Déco'},{x:-181,z:167,name:'Miramar'},{x:57,z:193,name:'South Point'},{x:-277,z:-263,name:'Ilha da Alfândega'}];
export const activities=[{x:204,z:165,name:'Contrarrelógio da orla',type:'race'},{x:-51,z:84,name:'Entregas do Café Sereia',type:'delivery'},{x:244,z:-218,name:'Mirante da marina',type:'lookout'}];
export const race=[{x:204,z:55},{x:204,z:-65},{x:204,z:-201},{x:138,z:-234},{x:72,z:-234}];
export const delivery=[{x:-56,z:29},{x:11,z:-28},{x:76,z:-99}];
let seed=9;
export function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
export function createWorld(scene, night){
  seed=9;
  const color = new T.Color(night ? '#4c4276' : '#d986a5');
  scene.fog=new T.FogExp2(color,.0036); scene.background=color;
  const sky=new T.Mesh(new T.SphereGeometry(680,36,20),new T.ShaderMaterial({side:T.BackSide, depthWrite:false, fog:false, uniforms:{top:{value:new T.Color(night?'#171936':'#4d356c')},bottom:{value:new T.Color(night?'#75446c':'#ffb797')}, sunColor:{value:new T.Color(night?'#ddd4ff':'#ffcd94')}, sunDir:{value:new T.Vector3(.57,.17,-.8).normalize()}}, vertexShader:`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top,bottom,sunColor,sunDir;varying vec3 v;void main(){vec3 d=normalize(v);float h=max(d.y,0.);float s=length(d-sunDir);vec3 c=mix(bottom,top,smoothstep(-.08,.55,h));c=mix(c,sunColor,.29*exp(-s*5.));float disc=1.-smoothstep(.070,.074,s);float stripes=(1.-smoothstep(-.036,-.013,d.y-sunDir.y))*step(.77,fract(d.y*72.));gl_FragColor=vec4(mix(c,sunColor,disc*(1.-stripes*.65)),1.);
#include <colorspace_fragment>
}` }));scene.add(sky);
  const hemi=new T.HemisphereLight(night?'#a9b9ed':'#ffeadf',night?'#59436c':'#a7769e',night?1.5:1.9);scene.add(hemi);
  const sun=new T.DirectionalLight(night?'#c8c8ff':'#ffd5a8',night?1.05:1.65);sun.position.set(100,155,-100);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-58;sun.shadow.camera.right=58;sun.shadow.camera.bottom=-58;sun.shadow.camera.top=58;sun.shadow.camera.far=235;sun.shadow.bias=-.00023;sun.shadow.normalBias=.09;scene.add(sun,sun.target);
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
  const geometry={frond:frondGeometry(),box:new T.BoxGeometry(),cyl:new T.CylinderGeometry(.48,.55,1,8),leaf:new T.SphereGeometry(.5,6,3),tri:new T.ConeGeometry(.6,1,4)};
  const groups=new Map(), blocks=[];
  const angles=new T.Euler(), pos=new T.Vector3(), scale=new T.Vector3(), q=new T.Quaternion(), matrix=new T.Matrix4();
  function put(c,x,y,z,w,h,d,kind='box',rx=0,ry=0,rz=0,em=false,shadow=true){
    const key=`${kind}:${em}:${shadow}`; if(!groups.has(key))groups.set(key,{kind,matrices:[],colors:[],em,shadow});const group=groups.get(key);
    angles.set(rx,ry,rz);q.setFromEuler(angles);matrix.compose(pos.set(x,y,z),q,scale.set(w,h,d));group.matrices.push(matrix.clone());group.colors.push(new T.Color(c));
  }
  const ground=(c,x,z,w,d,y)=>put(c,x,y-.035,z,w,.07,d,'box',0,0,0,false,false);
  ground('#6e5e78',-61,0,570,633,-.06); ground('#c9968d',233,0,47,645,-.16); ground('#9e697c',220,0,13,631,.085);
  ground(night?'#3d3e73':'#897fb3',451,0,408,1000,-.24);ground(night?'#5b557f':'#a18ab3',263,0,18,646,-.2);
  const ocean=new T.Mesh(new T.PlaneGeometry(410,1000),new T.ShaderMaterial({fog:false,uniforms:{clock:{value:0},night:{value:night?1:0}},vertexShader:`varying vec3 p;void main(){p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float clock,night;varying vec3 p;void main(){float d=distance(cameraPosition.xz,p.xz);float f=exp(-d*.005);float wav=sin(p.x*.84+sin(p.z*.18+clock*.42)*1.8-clock*1.7);float ripple=pow(max(0.,wav),12.)*(.4+.6*sin(p.z*2.1+p.x*.2+clock)*.5);float foam=exp(-abs(p.x-254.5-sin(p.z*.31-clock*.62)*.8)*.7);vec3 base=mix(vec3(.29,.22,.39),vec3(.109,.091,.221),night);vec3 horizon=mix(vec3(.52,.27,.38),vec3(.15,.104,.25),night);vec3 c=mix(horizon,base,f);c+=f*(ripple*.069+foam*.16)*vec3(1.,.73,.88);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`}));ocean.rotation.x=-Math.PI/2;ocean.position.set(459,-.212,0);scene.add(ocean);
  for(let i=0;i<200;i++){let x=260+random()*190,z=(random()-.5)*748;put(i%2?'#aa9dc4':'#829fc5',x,-.197,z,1+random()*6,.005,.07+random()*.14,'box',0,0,0,false,false);}
  for(const x of XS){ground('#413b55',x,-3,17,617,.01); for(let z=-300;z<300;z+=7.5) ground('#d2a494',x,z,.16,2.75,.025);ground('#9c859b',x-7.65,-3,.13,613,.026);ground('#9c859b',x+7.65,-3,.13,613,.026);}
  for(const z of ZS){ground('#413b55',-60,z,541,17,.014);for(let x=-324;x<212;x+=7.5) if(XS.every(a=>Math.abs(a-x)>9)) ground('#d2a494',x,z,2.75,.16,.026);}
  for(const x of XS) for(const z of ZS) for(let i=0;i<8;i++)ground('#b7a1ad',x-5.7+i*1.62,z+9,.78,1.5,.032);
  const palette=['#bb809e','#e4a196','#b1a0cc','#d4a9a8','#8e98be','#b4a9c6','#dca38e','#89a8b2'];
  function sign(text,x,y,z,w=10,h=1.6,angle=0, tint='#ffa6c7'){
    const can=document.createElement('canvas');can.width=256;can.height=64;const ctx=can.getContext('2d');ctx.fillStyle='#302141';ctx.fillRect(0,0,256,64);ctx.strokeStyle=tint;ctx.lineWidth=3;ctx.strokeRect(3,3,250,58);ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=tint;ctx.fillText(text,128,33,238);
    const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=angle;scene.add(mesh);
  }
  function palm(x,z,h){
    const lean=h*.083;put('#785c75',x+lean*.5,h*.48,z,.43,h,.43,'cyl',0,0,-.087);
    for(let i=1;i<8;i++)put('#a0808b',x+lean*i/8,h*i/8,z,.445,.072,.445,'cyl',0,0,-.087);
    put('#664c62',x+lean,h-.13,z,.64,.64,.65,'leaf');
    for(let k=0;k<9;k++){const a=k*Math.PI*2/9 + z*.15;const tint=['#266866','#36766f','#3b7773','#255563'][k%4];put(tint,x+lean,h-.04,z,1.15,1.18,.93+(k%3)*.14,'frond',k%2?.19:-.105,a,k%3*.09,false,false);}
  }
  function lamp(x,z,side){put('#493849',x,2.05,z,.16,4.1,.17,'cyl');put('#493849',x+side*.52,4.05,z,1.18,.12,.13);put('#ffd2a3',x+side*1.05,3.99,z,.55,.13,.34,'box',0,0,0,true);}
  function bench(x,z,ry=0){put('#885d73',x,.51,z,2.25,.14,.65,'box',0,ry,0);put('#9f7285',x,.83,z-.23,2.25,.4,.14,'box',0,ry,0);put('#52465c',x-.75,.24,z,.14,.46,.55);put('#52465c',x+.75,.24,z,.14,.46,.55);}
  const shopNames=['AURORA','PALM COURT','VIOLETA','HOTEL SOL','CAFÉ SEREIA','CLUBE LÚMEN','MIRAMAR','MARÉ MOTEL'];
  function building(x,z,w,d,h,col,variant,name){
    blocks.push({x,z,w,d}); const trim=new T.Color(col).lerp(new T.Color('#fcedde'),.37);
    put(col,x,h/2+.13,z,w,h,d);put(trim,x,h+.25,z,w+.7,.49,d+.7);put(col,x,h+.57,z,w*.75,.65,d*.75);
    if(variant===0){put(trim,x,h+1,z-d*.21,w*.28,1.55,d*.51);put(col,x,h+2.0,z-d*.21,w*.19,.65,d*.34);}
    for(let fl=0;fl<Math.floor(h/2.65);fl++){
      const y=1.65+fl*2.65;const tint=fl===0||random()>.6?(night?'#b3829f':'#6a597a'):'#484c75';
      if(variant===1){put(tint,x,y,z+d/2+.025,w*.88,1.05,.085);put(tint,x+w/2+.028,y,z,.08,1.05,d*.84);}
      else {for(let j=-1;j<=1;j++)put(tint,x+j*w*.28,y,z+d/2+.025,w*.20,1.2,.09);for(let j=-1;j<=1;j++)put(tint,x+w/2+.03,y,z+j*d*.29,.09,1.2,d*.19);}
      if(fl>0&&(variant===0||variant===2))put(trim,x,y-.74,z+d/2+.13,w+.16,.13,.32);
    }
    if(variant!==1){for(const k of [-1,1])put(trim,x+k*w*.43,h/2+.13,z+d/2+.12,.28,h,.32);}
    if(name){const glow=random()>.5?'#ffa2ce':'#9bebe5'; if(x>120)sign(name,x+w/2+.06,Math.min(5,h-.52),z,Math.min(d*.8,12),1.25,Math.PI/2,glow); sign(name,x,2.9,z+d/2+.20,Math.min(w*.7,10),1.4,0,glow);put(glow,x,3.94,z+d/2+.09,w*.96,.09,.2,'box',0,0,0,true);put('#404568',x,1.02,z+d/2+.04,2.1,2,.12);put(glow,x+w/2+.08,3.94,z,.18,.09,d*.96,'box',0,0,0,true);}
  }
  for(let ix=0;ix<XS.length-1;ix++) for(let iz=0;iz<ZS.length-1;iz++){
    const x=(XS[ix]+XS[ix+1])/2,z=(ZS[iz]+ZS[iz+1])/2;ground('#a5879c',x,z,48.5,48.5,.12);
    const plaza=(ix+iz*3)%11===4|| (ix===7&&[1,6].includes(iz));
    if(plaza){ground('#637e83',x,z,39,39,.14);ground('#bda3ad',x,z,3,39,.16);ground('#bda3ad',x,z,39,3,.16);for(const a of [-1,1])for(const b of [-1,1])palm(x+a*14,z+b*14,5+random()*2);bench(x-4,z+8);bench(x+4,z-8);put('#cf9eae',x,.22,z,6,.3,6,'cyl');put('#6696ae',x,.39,z,4.9,.06,4.9,'cyl');}
    else for(let a=0;a<2;a++) for(let b=0;b<2;b++){
      const h=4+random()*(ix<4&&iz<5?28:11);const w=16+random()*5,d=15+random()*6;
      let name=(ix>=6&&a===1&&b===1)?shopNames[(ix+iz)%shopNames.length]:null;
      if(ix===4&&iz===5&&a===0&&b===1)name='CAFÉ SEREIA';
      if(ix===3&&iz===3&&a===0&&b===0)name='CLUBE LÚMEN';
      building(x+(a-.5)*23,z+(b-.5)*23,w,d,h,palette[Math.floor(random()*palette.length)],(a+b+ix+iz)%4,name);
    }
    palm(x-22,z+22,5.4+random()*2);lamp(x+20.5,z+22,1);
  }
  function planter(x,z){
    put('#a68298',x,.29,z,1.38,.48,3.14);put('#684f65',x,.545,z,1.22,.05,2.95);
    for(let j=0;j<5;j++){put(j%2?'#4b7e77':'#6c8783',x+Math.sin(j)*.27,.68+random()*.24,z+(j-2)*.55,.63,.62,.84,'leaf',0,j*.45,.2);if(j%2)put('#e789ac',x+Math.sin(j)*.34,.96,z+(j-2)*.55,.21,.27,.25,'leaf');}
  }
  for(let z=-285;z<300;z+=22){
    const x=219.3;ground('#b992a0',x,z,6.9,20.1,.101);if(z%2){planter(221.7,z+4);}
    for(const sign of [-1,1])ground('#d9a7a6',x+sign*2.9,z,.21,20.1,.121);
  }
  for(let z=-299;z<303;z+=5){put('#9b829b',225.4,.53,z,.14,.88,.14);put('#be9ba9',225.4,.86,z+2.5,.12,.09,5.07);put('#b695a5',225.4,.49,z+2.5,.09,.065,5.07);}
  function kiosk(x,z,name,c,trim){
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
  sign('OCEAN DRIVE',214,3.1,26,5,.95);put('#725c77',214,1.3,26,.16,2.6,.16);sign('PORTO VIOLETA',239,3,-218,7,1.35);put('#725c77',239,1.3,-218,.18,2.6,.18);
  sign('MIRAMAR',-165,3.3,171,6,1.25);sign('DISTRITO ART DÉCO',-112,3.3,-96,8,1.25);
  for(const {kind,matrices,colors,em,shadow} of groups.values()){
    const mat=em?new T.MeshBasicMaterial({color:0xffffff}):new T.MeshStandardMaterial({color:0xffffff,roughness:.91,side:kind==='frond'?T.DoubleSide:T.FrontSide});
    const mesh=new T.InstancedMesh(geometry[kind],mat,matrices.length); matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,colors[i]);}); mesh.castShadow=shadow&&!em;mesh.receiveShadow=!em;scene.add(mesh);
  }
  const bucket=new Map();for(const b of blocks){const bx=Math.floor(b.x/22),bz=Math.floor(b.z/22);const k=`${bx},${bz}`;if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(b);}
  function collides(x,z,r){if(x<-337+r||x>257-r||z<-312+r||z>306-r)return true;const bx=Math.floor(x/22),bz=Math.floor(z/22);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const b of bucket.get(`${bx+i},${bz+j}`)||[])if(Math.abs(b.x-x)<b.w*.5+r&&Math.abs(b.z-z)<b.d*.5+r)return true;return false;}
  return { collides, sky, sun, blocks, tide(time){ocean.material.uniforms.clock.value=time;} };
}
