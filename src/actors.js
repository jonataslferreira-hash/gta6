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
export function person({jacket='#ad4278',skin='#bf795f',pants='#382d49',hair='#312334',type=0}={}){
  const root=new T.Group(), rig=joint(root,0,0,0), hips=joint(rig,0,.94,0), chest=joint(hips,0,.04,0);
  ell(hips,pants,0,.002,.013,.181,.133,.116);
  ell(chest,jacket,0,.265,.018,.218,.248,.116);ell(chest,jacket,0,.109,.014,.17,.14,.111);
  ell(chest,type===0?'#352539':'#d9b6b2',0,.228,-.091,.102,.184,.047);
  for(const side of [-1,1]){const trim=mesh(chest,box(),'#da789d',side*.085,.27,-.133,.014,.29,.010);trim.rotation.z=side*.19;}
  ell(chest,skin,0,.486,0,.071,.084,.063);
  const head=joint(chest,0,.56,-.008);
  ell(head,skin,0,.069,0,.109,.146,.112);ell(head,skin,0,.012,-.038,.083,.081,.078);
  ell(head,hair,0,.132,.023,.113,.103,.112);ell(head,hair,0,.055,.060,.105,.132,.065);
  if(type===0){const bang=ell(head,hair,-.048,.154,-.067,.074,.043,.054);bang.rotation.z=.35;}
  ell(head,skin,0,.047,-.110,.026,.031,.025);ell(head,'#783a4c',0,.015,-.107,.033,.009,.013);
  for(const side of [-1,1]){
    ell(head,skin,side*.105,.055,-.006,.027,.036,.019);ell(head,'#fff0dc',side*.043,.076,-.099,.025,.009,.012);ell(head,'#342234',side*.045,.075,-.109,.009,.009,.008);
    if(type===0){const e=mesh(head,geom('earring',()=>new T.TorusGeometry(.014,.003,6,9)),'#ffcb82',side*.117,.019,-.008);e.rotation.y=side*.27;}
  }
  const tail=joint(head,0,.116,.092);if(type===0){const tie=ell(tail,hair,0,-.068,.014,.077,.14,.074);tie.rotation.x=-.28;ell(tail,'#7e4775',0,0,0,.052,.025,.055);}
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
  let step=0;return {root,animate(dt,stride,sprint=0){
    step+=dt*(6+4*sprint);const wave=Math.sin(step), bob=Math.cos(step*2);const blend=1-Math.exp(-13*dt);
    const soften=(o,k,v)=>{o[k]+=(v-o[k])*blend;};
    soften(rig.position,'y',(-bob*.022+.013)*stride+Math.sin(step*.4)*.006);soften(rig.rotation,'x',-stride*(.035+.14*sprint));
    soften(hips.rotation,'y',wave*.086*stride);soften(chest.rotation,'y',-wave*.15*stride);soften(chest.rotation,'z',wave*.035*stride);soften(head.rotation,'y',wave*.025*stride);
    soften(tail.rotation,'x',wave*.17*stride);soften(tail.rotation,'z',Math.sin(step*.8)*.2*stride);
    arms.forEach(({arm,elbow,s},i)=>{const p=i===0?wave:-wave;soften(arm.rotation,'x',-p*(.37+.32*sprint)*stride);soften(arm.rotation,'z',s*(.09+.05*stride));soften(elbow.rotation,'x',-.12-stride*(.16+.62*sprint)+p*.08*stride);});
    legs.forEach(({thigh,knee,ankle},i)=>{const p=i===0?wave:-wave;const lift=Math.max(0,(i===0?Math.cos(step):-Math.cos(step)));soften(thigh.rotation,'x',p*(.41+sprint*.18)*stride-lift*.17*stride);soften(knee.rotation,'x',lift*(.75+sprint*.46)*stride);soften(ankle.rotation,'x',(-lift*.31-p*.14)*stride);});
  }};
}
function loft(key,levels){return geom(key,()=>{const v=[],ix=[];for(const [y,w,f,b] of levels)v.push(-w*.86,y,f,w*.86,y,f,w,y,f+.29,w,y,b-.3,w*.81,y,b,-w*.81,y,b,-w,y,b-.3,-w,y,f+.29);for(let k=0;k<levels.length-1;k++)for(let i=0;i<8;i++){const a=k*8+i,b=k*8+(i+1)%8;ix.push(a,a+8,b,b,a+8,b+8);}const l=(levels.length-1)*8;for(let i=1;i<7;i++){ix.push(0,i,i+1,l,l+i+1,l+i);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);const flat=g.toNonIndexed();flat.computeVertexNormals();return flat;});}
export function coupe(paint='#bf4e6c',variant=0){
  const root=new T.Group(), body=joint(root,0,0,0);
  mesh(body,loft('base',[[.26,.88,-1.94,1.93],[.49,1.02,-2.22,2.12],[.78,1.04,-2.16,2.07],[.94,.95,-1.96,1.91]]),paint,0,0,0);
  mesh(body,loft('glass',[[.92,.83,-1.03,1.31],[1.43,.69,-.32,.68],[1.49,.65,-.20,.65]]),'#454363',0,0,0);
  mesh(body,loft('roof',[[1.43,.70,-.35,.74],[1.51,.65,-.24,.66]]),variant===1?'#ead1c0':paint,0,0,0);
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
  return {root,update(dt,v,turn){body.rotation.z+=(turn*Math.abs(v)*.0025-body.rotation.z)*Math.min(1,dt*6);for(const w of wheels){w.spin.rotation.x-=v*dt/.42;if(w.front)w.axle.rotation.y=turn*.33;}}};
}
