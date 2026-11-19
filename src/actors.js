import * as T from 'three';
const matCache=new Map();const geomCache=new Map();
function mat(c,lit=false){const key=`${c}:${lit}`;if(!matCache.has(key))matCache.set(key,lit?new T.MeshBasicMaterial({color:c}):new T.MeshStandardMaterial({color:c,roughness:.77,metalness:.015}));return matCache.get(key);}
function geom(key,create){if(!geomCache.has(key))geomCache.set(key,create());return geomCache.get(key);}
function mesh(p,g,c,x,y,z,sx=1,sy=1,sz=1,lit=false){const m=new T.Mesh(g,mat(c,lit));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=!lit;m.receiveShadow=true;p.add(m);return m;}
const sph=()=>geom('sphere',()=>new T.SphereGeometry(1,12,8));
const box=()=>geom('box',()=>new T.BoxGeometry());
const cy=()=>geom('cyl',()=>new T.CylinderGeometry(1,1,1,14));
const cap=()=>geom('cap',()=>new T.CapsuleGeometry(.5,.7,3,8));
function joint(p,x,y,z){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g;}
function ell(p,c,x,y,z,w,h,d){return mesh(p,sph(),c,x,y,z,w,h,d);}
function portraitFace(head, skin, hair, style){
  const hiSphere=geom('portrait-sphere',()=>new T.SphereGeometry(1,28,18));
  const part=(p,c,x,y,z,w,h,d)=>mesh(p,hiSphere,c,x,y,z,w,h,d);
  const skinTone=(light,t)=>`#${new T.Color(skin).lerp(new T.Color(light),t).getHexString()}`;
  const jaw=style==='davi'?1.13:style==='nara'?.94:1;
  const g=geom(`portrait-${style}-${skin}`,()=>{
    const rows=[[-.074,.023,.047],[-.067,.050,.062],[-.048,.074,.077],[-.019,.092,.089],[.012,.101,.095],[.025,.105,.097],[.045,.109,.099],[.064,.111,.099],[.091,.111,.098],[.132,.107,.095],[.169,.094,.08],[.193,.065,.058],[.204,.020,.029]];
    const v=[],colors=[],idx=[],n=64;const base=new T.Color(skin),beard=new T.Color('#473440');
    rows.forEach(([y,w,d],i)=>{for(let j=0;j<n;j++){
      const t=j/n*Math.PI*2,x=Math.sin(t)*w*(i<5?jaw:1),front=Math.cos(t);
      const cheek=.010*Math.exp(-((Math.abs(x)-.064)**2)/.00059-((y-.019)**2)/.0009)*Math.max(0,front);
      const noseWidth=.00024, bridge=.023*Math.exp(-(x*x)/noseWidth-((y-.052)**2)/.0015),tip=.026*Math.exp(-(x*x)/.00034-((y-.022)**2)/.000095);
      v.push(x,y,-front*(d+cheek)+(y>=.132?.013:.003)-(bridge+tip)*Math.max(0,front)**5);
      const stubble=style==='davi'?Math.max(0,1-Math.abs(y+.049)/.045)*Math.max(0,front)**.5*.43:0;
      const c=base.clone().lerp(beard,stubble);colors.push(c.r,c.g,c.b);
      if(i){const a=(i-1)*n+j,b=(i-1)*n+(j+1)%n;idx.push(a,a+n,b,b,a+n,b+n);}
    }});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
  });
  const face=mesh(head,g,'#ffffff',0,0,0);face.material=geom(`portrait-skin-${style}`,()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.89}));
  const shade=skinTone('#583048',.17),lips=skinTone(style==='davi'?'#754638':'#963f59',.64);
  for(const s of [-1,1])part(head,shade,s*.012,.015,-.109,.006,.004,.005);
  const eyes=[];
  for(const s of [-1,1]){
    part(head,skin,s*.101,.038,.011,.022,.032,.019);part(head,shade,s*.114,.038,.004,.011,.021,.013);
    part(head,skin,s*.047,.060,-.086,.029,.012,.015).rotation.y=-s*.26;
    const eye=joint(head,s*.047,.065,-.091);eye.rotation.y=-s*.27;
    part(eye,'#e8d1bd',0,0,0,.024,.009,.008);
    const iris=part(eye,style==='nara'?'#627560':'#654531',0,0,-.006,.008,.008,.0034);
    const pupil=part(iris,'#1a1625',0,0,-1,.49,.70,.43);part(pupil,'#ffedde',-.32,.39,-.87,.30,.24,.20);
    const liner=part(eye,hair,0,.010,-.002,.026,.0034,.009);liner.rotation.z=s*.07;
    const brow=part(head,hair,s*.047,.093,-.095,.028,.006,.010);brow.rotation.y=-s*.25;
    eyes.push({eye,iris,brow,s});
  }
  const mouth=joint(head,0,-.029,-.088);
  part(mouth,lips,0,0,0,.034,.008,.010);
  const hole=part(mouth,'#3c2131',0,.001,-.011,.026,.002,.005);
  const teeth=part(mouth,'#f3ddc8',0,.003,-.016,.021,.002,.002);
  const lower=part(mouth,skinTone('#d17a83',.52),0,-.005,-.011,.028,.003,.004);
  const capGeo=geom(`hair-cap-${style}-${hair}`,()=>{
    const pos=[],colors=[],idx=[],n=96,m=26,base=new T.Color(hair),light=new T.Color('#936176');
    for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){
      const u=i/m,t=j/n*2*Math.PI,c=Math.cos(t),front=Math.max(0,c),s=Math.sin(t);
      const asym=style==='luzia'?.14*Math.sin(t+.85)*front:style==='davi'?.065*Math.cos(t*3.1)*front:0;
      const rim=(style==='davi'?1.60:2.1)-(style==='davi'?.50:style==='luzia'?1.03:.85)*front+asym;
      const phi=.003+u*rim,sweep=style==='luzia'?.44*(1-u)*front:0,volume=1+.023*Math.sin(t*4+u*3)+.006*Math.sin(26*(t+sweep)+u*4);
      pos.push(s*.118*Math.sin(phi)*volume+Math.sin(u*Math.PI)*sweep*.066,.079+.143*Math.cos(phi)*volume+(style==='luzia'?.014*front*Math.sin(u*Math.PI):0),.014-c*.125*Math.sin(phi)*volume);
      const ridge=(Math.sin(26*(t+sweep)+5*u+Math.sin(3*t))+1)*.5;const col=base.clone().lerp(light,.027+.085*ridge*Math.sin(u*Math.PI));colors.push(col.r,col.g,col.b);
      if(i&&j){const x=(i-1)*(n+1)+j-1;idx.push(x,x+1,x+n+1,x+1,x+n+2,x+n+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;
  });
  const cap=new T.Mesh(capGeo,geom('hair-cap-material',()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.87,side:T.DoubleSide})));head.add(cap);
  if(style==='davi')part(head,'#ddab71',-.116,.015,.001,.007,.007,.006);
  else if(style==='nara'){
    for(const s of [-1,1])for(let i=0;i<7;i++){
      const h=part(head,i%3===0?'#4f3046':hair,s*(.082+.011*Math.sin(i*2)),.165-i*.027,.036+.012*(i%2),.029,.035,.046);h.rotation.x=.39;
    }
    part(head,'#f2b28e',.117,.009,-.002,.009,.013,.009);
  }else{
    const tail=joint(head,.012,.12,.095);part(tail,hair,0,-.052,.027,.066,.146,.066).rotation.x=-.39;
    for(const s of [-1,1])mesh(head,geom('portrait-hoop',()=>new T.TorusGeometry(.018,.0034,9,25)),'#ffce8b',s*.117,.005,.008).rotation.y=s*.35;
  }
  const moods={wry:[.005,.017,.13,.06],tense:[-.007,-.003,-.12,-.02],fear:[.012,.014,.17,-.1],anger:[-.012,-.01,-.27,-.04],shock:[.018,.020,.16,0],cold:[-.004,.002,-.14,.01]};
  return (t,dt,{speaking=false,voice=0,mood='cold',look=0,beat=0}={})=>{
    const [a,b,tilt,smile]=moods[mood]||moods.cold,smooth=(obj,k,value)=>{obj[k]+= (value-obj[k])*(1-Math.exp(-dt*19));};
    const seed=style==='davi'?.24:style==='nara'?1.98:1.08,bp=(t+seed)%3.87;
    const blink=Math.max(.045,Math.min(1,Math.abs(bp-.13)*10));
    for(const {s,eye,iris,brow} of eyes){eye.scale.y=blink*(mood==='shock'?1.28:mood==='anger'?.79:1);iris.position.x=-look*.006+Math.sin(t*1.64)*.0018;
      smooth(brow.position,'y',.093+(s===1?a:b)+(speaking?Math.sin(beat*6+s)*.003:0));smooth(brow.rotation,'z',s*tilt);}
    const open=speaking?Math.min(1,voice*2.7):0;
    smooth(hole.scale,'y',.0018+open*.0085+(mood==='shock'?.003:0));smooth(hole.scale,'x',.023+.005*Math.sin(beat*8)*open);
    smooth(lower.position,'y',-.005-open*.009);teeth.visible=open>.18;smooth(mouth.rotation,'z',smile);
    smooth(head.rotation,'x',(mood==='anger'?.09:mood==='shock'?-.10:0)+(speaking?Math.sin(beat*3.2)*.053:Math.sin(t*1.6)*.03));
    smooth(head.rotation,'y',look*.22+(speaking?Math.sin(beat*2.3)*.047:0));smooth(head.rotation,'z',(mood==='wry'?.092:0)+Math.sin(t*.92)*.042);
  };
}
export function person({jacket='#ad4278',skin='#bf795f',pants='#382d49',hair='#312334',type=0,portrait=null}={}){
  const root=new T.Group(), rig=joint(root,0,0,0), hips=joint(rig,0,.94,0), chest=joint(hips,0,.04,0);
  ell(hips,pants,0,.002,.013,.181,.133,.116);
  ell(chest,jacket,0,.265,.018,.218,.248,.116);ell(chest,jacket,0,.109,.014,.17,.14,.111);
  ell(chest,type===0?'#352539':'#d9b6b2',0,.228,-.091,.102,.184,.047);
  for(const side of [-1,1]){const trim=mesh(chest,box(),'#da789d',side*.085,.27,-.133,.014,.29,.010);trim.rotation.z=side*.19;}
  ell(chest,skin,0,.486,0,.071,.084,.063);
  const head=joint(chest,0,.56,-.008);
  let face,tail;
  if(portrait){face=portraitFace(head,skin,hair,portrait);tail=joint(head,0,.12,.09);}
  else {ell(head,skin,0,.069,0,.109,.146,.112);ell(head,skin,0,.012,-.038,.083,.081,.078);
  ell(head,hair,0,.132,.023,.113,.103,.112);ell(head,hair,0,.055,.060,.105,.132,.065);
  if(type===0){const bang=ell(head,hair,-.048,.154,-.067,.074,.043,.054);bang.rotation.z=.35;}
  ell(head,skin,0,.047,-.110,.026,.031,.025);ell(head,'#783a4c',0,.015,-.107,.033,.009,.013);
  for(const side of [-1,1]){
    ell(head,skin,side*.105,.055,-.006,.027,.036,.019);ell(head,'#fff0dc',side*.043,.076,-.099,.025,.009,.012);ell(head,'#342234',side*.045,.075,-.109,.009,.009,.008);
    if(type===0){const e=mesh(head,geom('earring',()=>new T.TorusGeometry(.014,.003,6,9)),'#ffcb82',side*.117,.019,-.008);e.rotation.y=side*.27;}
  }
  tail=joint(head,0,.116,.092);if(type===0){const tie=ell(tail,hair,0,-.068,.014,.077,.14,.074);tie.rotation.x=-.28;ell(tail,'#7e4775',0,0,0,.052,.025,.055);}
  }
  if(portrait){
    for(const s of [-1,1]){
      const lapel=mesh(chest,box(),jacket,s*.071,.365,-.104,.051,.107,.031);lapel.rotation.z=s*.31;
      const piping=mesh(chest,box(),'#baa0a6',s*.089,.304,-.128,.008,.086,.009);piping.rotation.z=s*.16;
    }
    if(portrait!=='davi')mesh(chest,geom('pendant-chain',()=>new T.TorusGeometry(.045,.0019,6,28)), '#d8a45f',0,.434,-.070,1,1.22,1).rotation.x=-.49;
  }
  const arms=[],legs=[];
  ell(chest,jacket,0,.237,.021,.208,.215,.125);
  if(type===0){for(const s of [-1,1]){ell(chest,'#d56b96',s*.136,.25,.107,.015,.11,.015);}}
  for(const s of [-1,1]){
    const arm=joint(chest,s*.192,.405,.005); arm.rotation.z=s*.105;
    ell(arm,jacket,0,-.025,0,.072,.101,.078);mesh(arm,cap(),jacket,0,-.122,0,.14,.186,.139);
    const elbow=joint(arm,0,-.234,0);mesh(elbow,cap(),jacket,0,-.085,0,.121,.144,.123);ell(elbow,skin,0,-.221,-.004,.042,.067,.043);arms.push({arm,elbow,s});
    const thigh=joint(hips,s*.092,-.059,.012);mesh(thigh,cap(),pants,0,-.18,0,.174,.294,.174);
    const knee=joint(thigh,0,-.398,-.012);mesh(knee,cap(),pants,0,-.183,.012,.147,.279,.15);
    const ankle=joint(knee,0,-.382,0);ell(ankle,'#342c40',0,-.046,-.058,.078,.065,.134);ell(ankle,'#dcb0b8',0,-.080,-.059,.079,.020,.135);legs.push({thigh,knee,ankle});
  }
  let step=0;const originalJacket=mat(jacket),originalPants=mat(pants),closet=[];
  root.traverse(o=>{if(o.material===originalJacket||o.material===originalPants)closet.push([o,o.material===originalJacket]);});
  return {root,outfit(option){for(const [o,top] of closet)o.material=option.colors?mat(`rgb(${(top?option.colors.jacket:option.colors.pants).join(',')})`):(top?originalJacket:originalPants);},animate(dt,stride,sprint=0,acting){
    step+=dt*(6+4*sprint);const wave=Math.sin(step), bob=Math.cos(step*2);const blend=1-Math.exp(-13*dt);
    const soften=(o,k,v)=>{o[k]+=(v-o[k])*blend;};
    soften(rig.position,'y',(-bob*.022+.013)*stride+Math.sin(step*.4)*.006);soften(rig.rotation,'x',-stride*(.035+.14*sprint));
    soften(hips.rotation,'y',wave*.086*stride);soften(chest.rotation,'y',-wave*.15*stride);soften(chest.rotation,'z',wave*.035*stride);soften(head.rotation,'y',wave*.025*stride);
    soften(tail.rotation,'x',wave*.17*stride);soften(tail.rotation,'z',Math.sin(step*.8)*.2*stride);
    face?.(step/6,dt,acting);const emphasis=acting?.speaking?Math.sin(acting.beat*2.6)**2:0,seated=Boolean(acting?.seated),driver=Boolean(acting?.driver);
    soften(rig.rotation,'z',seated?Math.sin(step*.41)*.012:0);
    if(acting){soften(chest.rotation,'y',acting.look*.045+Math.sin(step*.22)*.023);soften(chest.rotation,'x',acting.lean||Math.sin(step*.18)*.014);}else soften(chest.rotation,'x',0);
    arms.forEach(({arm,elbow,s},i)=>{const p=i===0?wave:-wave;soften(arm.rotation,'x',seated?(driver?.89:.26)+(driver?.04:.24)*emphasis:-p*(.37+.32*sprint)*stride-emphasis*(i===0?.24:.08));soften(arm.rotation,'z',s*(seated?(driver?-.18:.04):.09+.05*stride+emphasis*.07));soften(elbow.rotation,'x',seated?(driver?.66:.99)+emphasis*(driver?.07:.34):-.12-stride*(.16+.62*sprint)+p*.08*stride-emphasis*(i===0?.6:.2));});
    legs.forEach(({thigh,knee,ankle},i)=>{const p=i===0?wave:-wave;const lift=Math.max(0,(i===0?Math.cos(step):-Math.cos(step)));soften(thigh.rotation,'x',seated?1.32:p*(.41+sprint*.18)*stride-lift*.17*stride);soften(knee.rotation,'x',seated?-1.30:lift*(.75+sprint*.46)*stride);soften(ankle.rotation,'x',(-lift*.31-p*.14)*stride);});
  }};
}
function loft(key,levels){return geom(key,()=>{const v=[],ix=[];for(const [y,w,f,b] of levels)v.push(-w*.86,y,f,w*.86,y,f,w,y,f+.29,w,y,b-.3,w*.81,y,b,-w*.81,y,b,-w,y,b-.3,-w,y,f+.29);for(let k=0;k<levels.length-1;k++)for(let i=0;i<8;i++){const a=k*8+i,b=k*8+(i+1)%8;ix.push(a,a+8,b,b,a+8,b+8);}const l=(levels.length-1)*8;for(let i=1;i<7;i++){ix.push(0,i,i+1,l,l+i+1,l+i);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);const flat=g.toNonIndexed();flat.computeVertexNormals();return flat;});}
export function coupe(paint='#bf4e6c',variant=0){
  const root=new T.Group(), body=joint(root,0,0,0);
  mesh(body,loft('base',[[.26,.88,-1.94,1.93],[.49,1.02,-2.22,2.12],[.78,1.04,-2.16,2.07],[.94,.95,-1.96,1.91]]),paint,0,0,0);
  mesh(body,loft('glass',[[.92,.83,-1.03,1.31],[1.43,.69,-.32,.68],[1.49,.65,-.20,.65]]),'#454363',0,0,0);
  mesh(body,loft('roof',[[1.43,.70,-.35,.74],[1.51,.65,-.24,.66]]),variant===1?'#ead1c0':paint,0,0,0);
  if(variant===3){for(const x of [-.19,.19]){
    mesh(body,box(),'#b43862',x,.953,-1.47,.23,.022,.91);
    mesh(body,box(),'#b43862',x,1.515,.224,.23,.018,.89);
    mesh(body,box(),'#b43862',x,.954,1.60,.23,.022,.57);
  }}
  if(variant===2){mesh(body,box(),'#ad839d',0,1.04,1.73,1.76,.10,.32);for(const x of [-.56,.56])mesh(body,box(),'#4e3b55',x,.971,1.7,.12,.16,.18);}
  for(const x of [-.37,.37]){
    mesh(body,box(),'#423446',x,1.03,.52,.54,.39,.075).rotation.x=-.16;
    mesh(body,box(),'#654855',x,1.23,.55,.21,.18,.09);
  }
  mesh(body,box(),'#392d42',0,.99,-.49,1.44,.14,.28);
  mesh(body,geom('driver-wheel',()=>new T.TorusGeometry(.125,.015,7,24)),'#352b39',-.37,1.025,-.265).rotation.x=.91;
  mesh(body,box(),'#a77285',0,1.027,-.365,.27,.037,.016);
  const wheels=[];
  for(const s of [-1,1]){
    for(const z of [-1.38,1.36]){const axle=joint(body,s*.96,.45,z);const spin=joint(axle,0,0,0);const tire=mesh(spin,cy(),'#2a2435',0,0,0,.425,.28,.425);tire.rotation.z=Math.PI/2;const rim=mesh(spin,cy(),'#b59bb4',s*.15,0,0,.258,.045,.258);rim.rotation.z=Math.PI/2;for(let j=0;j<5;j++){const spoke=mesh(spin,box(),'#5e5269',s*.18,0,0,.025,.056,.445);spoke.rotation.x=j*Math.PI/5;}wheels.push({axle,spin,front:z<0});}
    mesh(body,box(),paint,s*.756,1.13,.29,.075,.49,.085);
    mesh(body,box(),paint,s*.99,1.01,-.72,.23,.13,.25);
    mesh(body,box(),'#4d3c57',s*1.043,.72,.34,.022,.061,.31);
    mesh(body,box(),'#fff0c4',s*.68,.68,-2.15,.47,.14,.065,true);
    mesh(body,box(),'#fc667d',s*.68,.68,2.075,.49,.13,.06,true);
    mesh(body,box(),'#9b8299',s*.62,.46,2.055,.48,.077,.12);
  }
  mesh(body,box(),'#433548',0,.57,-2.19,1.35,.12,.075);mesh(body,box(),'#b898a9',0,.44,-2.15,1.81,.1,.074);mesh(body,box(),'#d9b5bc',0,.67,2.088,.35,.15,.042);
  let prior=0,pitch=0,nod=0;
  return {root,update(dt,v,turn,impact=0){
    const a=Math.max(-14,Math.min(10,(v-prior)/Math.max(dt,.01)));prior=v;
    nod=Math.max(nod,Math.min(.13,impact*.009))-dt*.20;nod=Math.max(0,nod);
    pitch+=(a*.003+nod-pitch)*(1-Math.exp(-dt*9));body.rotation.x=pitch;
    body.rotation.z+=(turn*Math.abs(v)*.0027-body.rotation.z)*(1-Math.exp(-dt*7));
    for(const w of wheels){w.spin.rotation.x-=v*dt/.42;if(w.front)w.axle.rotation.y=turn*.34;}
  }};
}

// Rigged, continuous-skin hero with blended authored locomotion clips.
export function riggedPerson(asset,{accent=null}={}){
  const actor=new T.Group(), visual=asset.clone(asset.scene), head=visual.getObjectByName('Head');
  visual.updateMatrixWorld(true);
  const hair=new T.Group();visual.add(hair);
  ell(hair,'#281d32',0,1.708,-.006,.098,.11,.100);
  ell(hair,'#281d32',0,1.643,-.070,.088,.099,.054);
  const bang=ell(hair,'#38233e',-.038,1.722,.057,.060,.026,.047);bang.rotation.z=-.36;
  ell(hair,'#33253e',.035,1.717,.047,.057,.032,.063);
  const pony=joint(hair,0,1.716,-.091);ell(pony,'#3e2a45',0,-.085,-.035,.049,.116,.047).rotation.x=.42;
  ell(pony,'#2c1b32',.019,-.16,-.065,.035,.086,.04).rotation.z=-.21;
  const hoops=geom('hero-hoop',()=>new T.TorusGeometry(.020,.0046,6,14));
  for(const side of [-1,1])mesh(hair,hoops,'#f4ae6e',side*.095,1.602,.009).rotation.y=side*.42;
  head?.attach(hair);
  visual.rotation.y=Math.PI;actor.add(visual);
  visual.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;if(accent&&o.material.name==='MI_Superhero_Female'){o.material=o.material.clone();o.material.color.set(accent);}});
  let outfitMesh;visual.traverse(o=>{if(o.isSkinnedMesh&&o.material.name==='MI_Superhero_Female')outfitMesh=o;});
  const originalMap=outfitMesh?.material.map, maps=new Map();
  if(outfitMesh&&!accent)outfitMesh.material=outfitMesh.material.clone();
  function changeOutfit(option){
    if(!outfitMesh||!originalMap?.image||accent)return;
    if(!option.colors){outfitMesh.material.map=originalMap;outfitMesh.material.needsUpdate=true;return;}
    if(!maps.has(option.id)){
      const image=originalMap.image,c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const {width,height}=c;const pixels=ctx.getImageData(0,0,width,height),d=pixels.data;
      for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];
        const jacket=r>g*1.54&&b>g*1.23&&r>b*1.14,pants=r<108&&g<86&&b>r*1.16;
        if(!jacket&&!pants)continue;const base=jacket?option.colors.jacket:option.colors.pants,shade=jacket?Math.max(.41,Math.min(1.45,(r+g+b)/279)):Math.max(.52,Math.min(1.4,(r+g+b)/187));
        for(let j=0;j<3;j++)d[i+j]=base[j]*shade;
      }
      ctx.putImageData(pixels,0,0);const map=new T.CanvasTexture(c);map.colorSpace=originalMap.colorSpace;map.flipY=originalMap.flipY;map.anisotropy=4;maps.set(option.id,map);
    }
    outfitMesh.material.map=maps.get(option.id);outfitMesh.material.needsUpdate=true;
  }
  const mixer=new T.AnimationMixer(visual), clips=Object.fromEntries(asset.animations.map(c=>[c.name,mixer.clipAction(c)]));
  let current=clips.Idle_Loop, oneShot=null,clock=0;current.play();
  function activate(name){const next=clips[name];if(!next||next===current)return;next.reset().setEffectiveWeight(1).play();current.crossFadeTo(next,.21,true);current=next;}
  return {root:actor,outfit:changeOutfit,disposeOutfits(){for(const t of maps.values())t.dispose();}, animate(dt,stride,sprint=0,talking=false){
    clock+=dt;const action=oneShot?'Interact':talking?'Idle_Talking_Loop':stride<.068?'Idle_Loop':sprint>.66?'Sprint_Loop':sprint>.2?'Jog_Fwd_Loop':'Walk_Loop';
    activate(action);if(action==='Walk_Loop')current.setEffectiveTimeScale(.63+stride*.34);if(action==='Sprint_Loop'||action==='Jog_Fwd_Loop')current.setEffectiveTimeScale(.85+sprint*.13);
    if(oneShot&&(oneShot-=dt)<=0)oneShot=null;
    pony.rotation.x=.09*Math.sin(clock*11)*stride;pony.rotation.z=.13*Math.sin(clock*9)*stride;mixer.update(dt);
  },interact(){oneShot=.78;}};
}
