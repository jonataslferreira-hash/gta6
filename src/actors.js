import * as T from 'three';
import { idlePerformance } from './idle-performance.js';
import { eyeAtlasBasis,followEyeGaze } from './eye-gaze.js';
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
// Continuous garment silhouette with shoulder, waist and hem rings; normals are smoothed
// around the body so the sleeves read as part of the jacket, not separate spheres.
function garment(key,rings){return geom(key,()=>{
  const vertices=[],indices=[],n=24;
  rings.forEach(([y,w,front,back],i)=>{for(let j=0;j<n;j++){
    const a=j/n*Math.PI*2,c=Math.cos(a),st=Math.sin(a);const fold=1+.016*Math.sin(a*7+i*.76);
    vertices.push(st*w*fold,y,(c<0?front:back)*c*fold);
    if(i){const p=(i-1)*n+j,q=(i-1)*n+(j+1)%n;indices.push(p,q,p+n,q,q+n,p+n);}
  }});
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
});}
function stitch(p,name,points,color,r=.003){const g=geom(name,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q))),12,r,5,false));return mesh(p,g,color,0,0,0);}
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
      const socket=.008*Math.exp(-((Math.abs(x)-.047)**2)/.00048-((y-.065)**2)/.000105)*Math.max(0,front)**8;
      v.push(x,y,socket-front*(d+cheek)+(y>=.132?.013:.003)-(bridge+tip)*Math.max(0,front)**5);
      const stubble=style==='davi'?Math.max(0,1-Math.abs(y+.049)/.045)*Math.max(0,front)**.5*.43:0;
      const c=base.clone().lerp(beard,stubble);colors.push(c.r,c.g,c.b);
      if(i){const a=(i-1)*n+j,b=(i-1)*n+(j+1)%n;idx.push(a,a+n,b,b,a+n,b+n);}
    }});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
  });
  const face=mesh(head,g,'#ffffff',0,0,0);face.material=geom(`portrait-skin-${style}`,()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.89}));
  const shade=skinTone('#583048',.17),lips=skinTone(style==='davi'?'#754638':'#963f59',.64);
  for(const s of [-1,1])part(head,shade,s*.012,.015,-.109,.006,.004,.005);
  const eyes=[],gaze=new T.Vector2();
  for(const s of [-1,1]){
    part(head,skin,s*.101,.038,.011,.022,.032,.019);part(head,shade,s*.114,.038,.004,.011,.021,.013);
    const eye=joint(head,s*.047,.065,-.092);eye.rotation.y=-s*.36;
    part(eye,'#baa18e',0,0,.0015,.0235,.009,.0062);
    part(eye,'#ebd8c6',0,0,0,.022,.0076,.0063);
    const iris=part(eye,style==='nara'?'#53634f':'#654531',0,0,-.0055,.0064,.0066,.0018);
    const pupil=part(iris,'#251d22',0,0,-.98,.54,.60,.39);part(pupil,'#e4d9c6',-.27,.31,-.91,.23,.20,.16);
    const liner=part(eye,hair,0,.0064,-.001,.0225,.0025,.0053);liner.rotation.z=s*.06;
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
  return (t,dt,{speaking=false,voice=0,mood='cold',look=0,eye=look,eyePitch,beat=0,pitch=0,eyeClose=0,headTilt=0}={})=>{
    const [a,b,tilt,smile]=moods[mood]||moods.cold,smooth=(obj,k,value)=>{obj[k]+= (value-obj[k])*(1-Math.exp(-dt*19));};
    const seed=style==='davi'?.24:style==='nara'?1.98:1.08,bp=(t+seed)%3.87;
    const blink=Math.max(.045,Math.min(1-eyeClose,Math.abs(bp-.13)*10));
    followEyeGaze(gaze,dt,{eye,eyePitch,pitch},Math.sin(t*1.64));
    for(const {s,eye,iris,brow} of eyes){eye.scale.y=blink*(mood==='shock'?1.18:mood==='anger'?.85:1);
      iris.position.x=-gaze.x*.0045-s*.0020;iris.position.y=gaze.y*.0012;iris.visible=blink>.17;
      smooth(brow.position,'y',.093+(s===1?a:b)+(speaking?Math.sin(beat*6+s)*.003:0));smooth(brow.rotation,'z',s*tilt);}
    const open=speaking?Math.min(1,voice*2.7):0;
    smooth(hole.scale,'y',.0018+open*.0085+(mood==='shock'?.003:0));smooth(hole.scale,'x',.023+.005*Math.sin(beat*8)*open);
    smooth(lower.position,'y',-.005-open*.009);teeth.visible=open>.18;smooth(mouth.rotation,'z',smile);
    smooth(head.rotation,'x',pitch+(mood==='anger'?.09:mood==='shock'?-.10:0)+(speaking?Math.sin(beat*3.2)*.053:Math.sin(t*1.6)*.03));
    smooth(head.rotation,'y',look*.22+(speaking?Math.sin(beat*2.3)*.047:0));smooth(head.rotation,'z',headTilt+(mood==='wry'?.092:0)+Math.sin(t*.92)*.042);
  };
}
export function person({jacket='#ad4278',skin='#bf795f',pants='#382d49',hair='#312334',type=0,portrait=null,extra=null}={}){
  const root=new T.Group(), rig=joint(root,0,0,0), hips=joint(rig,0,.94,0), chest=joint(hips,0,.04,0);
  ell(hips,pants,0,.002,.013,.181,.133,.116);
  const beach=extra?.beach,variant=extra?.variant??0;
  const shortSleeves=!!extra&&!extra.uniform&&!beach&&variant%5===1;
  const workVest=!!extra&&!extra.uniform&&!beach&&variant%5===3;
  const openCollar=!!extra&&!extra.uniform&&!beach&&variant%5===4;
  const sleeveTone=workVest?'#c7ad98':jacket;
  if(extra)rig.scale.set(extra.build,extra.height,1);
  const tapered=portrait!=='davi'&&type===0;
  const torso=garment(tapered?'jacket-tailored':'jacket-straight',[[.016,.125,.093,.096],[.061,.162,.106,.105],[.13,tapered?.148:.167,.101,.111],[.23,tapered?.177:.185,.124,.121],[.34,.202,.124,.127],[.397,.188,.097,.109],[.445,.123,.080,.085],[.466,.053,.051,.060]]);
  mesh(chest,torso,jacket,0,0,0);
  if(!beach&&!shortSleeves){
    ell(chest,type===0?'#3f2b40':'#d0b2a8',0,.316,-.114,.077,.117,.019);
    for(const side of [-1,1]){
      const trim=stitch(chest,`piping-${side}`,[[side*.079,.426,-.084],[side*.077,.379,-.110],[side*.057,.284,-.125],[side*.048,.151,-.108],[side*.051,.076,-.104]],type===0?'#db8aae':'#b3a6b5',.0045);
      trim.castShadow=false;
    }
    const band=garment('jacket-hem',[[.028,.135,.098,.102],[.043,.161,.108,.111],[.060,.163,.110,.111],[.068,.160,.108,.110]]);mesh(chest,band,jacket,0,0,0);
    const zip=mesh(chest,box(),'#ad899d',.013,.206,-.127,.006,.14,.009);zip.rotation.z=-.055;
    mesh(chest,box(),'#e7ba9f',.009,.267,-.134,.015,.021,.010);
    if(openCollar)for(const side of [-1,1]){const flap=ell(chest,'#c6b1ad',side*.081,.401,-.104,.031,.065,.017);flap.rotation.z=-side*.38;}
    if(workVest)for(const side of [-1,1]){mesh(chest,box(),'#62505b',side*.101,.242,-.127,.102,.086,.018);mesh(chest,box(),'#af937d',side*.101,.278,-.142,.098,.013,.018);}
  }else if(shortSleeves){
    const collar=mesh(chest,geom('tee-neck',()=>new T.TorusGeometry(.048,.0045,8,24)),'#dfbbb2',0,.433,-.067);collar.rotation.x=-.77;
    for(let i=0;i<3;i++)ell(chest,pants,(i-1)*.019,.313-i*.018,-.127,.051-i*.008,.0048,.008);
  }else{
    ell(chest,skin,0,.402,-.077,.087,.068,.039);
    for(let i=0;i<3;i++){const panel=ell(chest,pants,(i-1)*.025,.137+i*.063,-.108-i*.004,.121-(i%2)*.018,.012,.010);panel.rotation.z=variant%2?.21:-.16;}
  }

  ell(chest,skin,0,.486,0,.071,.084,.063);
  const head=joint(chest,0,.56,-.008);
  let face,tail;
  if(portrait){face=portraitFace(head,skin,hair,portrait);tail=joint(head,0,.12,.09);}
  else {
    const form=variant%6,jaw=[.064,.081,.080,.071,.091,.069][form],cheek=[.091,.102,.108,.094,.110,.101][form];
    mesh(head,garment(`street-head-${form}`,[[ -.067,.028,.043,.040],[-.052,jaw*.78,.071,.050],[-.021,jaw,.095,.071],[.025,cheek*.99,.103,.092],[.063,cheek,.100,.103],[.095,cheek*.94,.097,.106],[.133,cheek*.89,.089,.100],[.170,cheek*.72,.069,.083],[.199,.033,.031,.042],[.205,.003,.005,.006]]),skin,0,0,0);
    const nose=[.031,.025,.034,.023,.031,.026][form],lip=type===0?'#96545c':'#754750';
    ell(head,skin,.002,.059,-.099,nose*.54,.054,.021);
    ell(head,skin,0,.030,-.119,nose,.019,.023);
    for(const side of [-1,1])ell(head,'#553632',side*nose*.57,.022,-.132,.005,.003,.003);
    const mouth=joint(head,0,-.008,-.100);ell(mouth,'#55303b',0,0,-.003,.030,.005,.009);
    const bottom=ell(mouth,lip,0,-.004,-.004,.027,.0055,.010);
    const top=ell(mouth,lip,0,.004,-.004,.030,.004,.009);
    const eyes=[],gaze=new T.Vector2();
    for(const side of [-1,1]){
      const ear=ell(head,skin,side*cheek,.042,.000,.022,.033,.018);ear.rotation.y=side*.24;
      ell(head,lip,side*(cheek+.009),.041,-.009,.010,.020,.007);
      const eye=joint(head,side*(.041+form*.0011),.072+form%2*.004,-.093);eye.rotation.y=-side*.10;
      ell(eye,'#dfcec0',0,0,0,.021,.008,.006);
      const iris=ell(eye,form%3===0?'#5d6c63':'#654434',0,-.0003,-.005,.0064,.0065,.0022);
      ell(iris,'#21191e',0,0,-.91,.50,.63,.42);ell(iris,'#fff4dc',-.24,.32,-.96,.22,.22,.14);
      const brow=ell(eye,hair,0,.018,.004,.024,form%2?.004:.005,.009);brow.rotation.z=side*(.12-form*.041);
      eyes.push({eye,iris,brow});
      if(type===0&&form!==2){const e=mesh(head,geom('earring',()=>new T.TorusGeometry(.014,.0025,7,12)),form===4?'#c5bdca':'#ffcb82',side*(cheek+.008),.015,-.014);e.rotation.y=side*.27;}
    }
    if(form===3||form===5){ell(head,hair,0,.168,.019,cheek*1.04,.048,.100);ell(head,hair,0,.092,.077,cheek*.96,.091,.039);}
    else{ell(head,hair,0,.170,.025,cheek*1.11,.064,.113);ell(head,hair,0,.074,.081,cheek*1.07,.109,.057);}
    if(type===0&&form!==4){const bang=ell(head,hair,-.035,.151,-.077,.067,.029,.034);bang.rotation.z=.37;}
    tail=joint(head,0,.126,.101);
    if(type===0&&form%2===0){const knot=ell(tail,hair,0,form===0?.025:-.057,.031,form===0?.062:.041,form===0?.063:.116,.046);knot.rotation.x=-.30;}
    face=(t,dt,act)=>{
      const blink=1-.83*Math.max(0,1-Math.abs(((t+variant*.31)%3.41)-3.19)/.095),voice=act?.speaking?(act.voice||.08):0;
      const s=1-Math.exp(-dt*14),look=act?.look||0;bottom.position.y+=(-.004-voice*.017-bottom.position.y)*s;top.rotation.z=.06*look;
      followEyeGaze(gaze,dt,act,Math.sin(Math.floor(t*2.3)*2.91));
      for(const {eye,iris,brow} of eyes){eye.scale.y=blink;iris.position.x=-gaze.x*.004;iris.position.y=-.0003+gaze.y*.0012;iris.visible=blink>.17;brow.position.y=.018+voice*.004;}
    };
  }
  if(portrait){
    for(const s of [-1,1]){
      const lapel=mesh(chest,box(),jacket,s*.071,.365,-.104,.051,.107,.031);lapel.rotation.z=s*.31;
      const piping=mesh(chest,box(),'#baa0a6',s*.089,.304,-.128,.008,.086,.009);piping.rotation.z=s*.16;
    }
    if(portrait!=='davi')mesh(chest,geom('pendant-chain',()=>new T.TorusGeometry(.045,.0019,6,28)), '#d8a45f',0,.434,-.070,1,1.22,1).rotation.x=-.49;
  }
  if(extra){
    head.scale.set(1+(variant%3-1)*.15,1+(variant%4-1)*.085,1);
    if(variant%4===0&&!extra.uniform){ell(head,'#ded0a3',0,.159,-.011,.156,.020,.155);ell(head,'#ded0a3',0,.184,.006,.107,.066,.106);}
    if(variant%4===1)for(let i=0;i<6;i++)ell(head,hair,Math.sin(i*1.9)*.068,.171+(i%3)*.029,Math.cos(i*1.9)*.066,.049,.044,.05);
    if(variant%4===2)for(const sign of [-1,1])ell(head,'#25343f',sign*.047,.076,-.113,.042,.018,.010);
    if(variant%4===3&&type===1){ell(head,hair,0,-.023,-.086,.061,.023,.020);ell(head,hair,0,.011,-.109,.034,.006,.010);}
    if(!beach&&!extra.uniform&&variant%3===1){
      const strap=mesh(chest,cap(),'#55444e',.013,.247,-.124,.028,.46,.022);strap.rotation.z=.48;
      const satchel=ell(hips,'#66535a',-.154,.001,-.105,.093,.096,.048);satchel.rotation.z=.13;
      ell(hips,'#ae8272',-.153,.012,-.146,.077,.041,.016);
    }
    if(extra.uniform){mesh(chest,box(),'#d3b680',.112,.292,-.127,.054,.036,.015);mesh(chest,box(),'#231f30',-.137,.26,-.125,.057,.096,.032);}
    if(beach){for(const sign of [-1,1]){const stripe=ell(chest,pants,sign*.083,.333,-.103,.037,.057,.029);stripe.rotation.z=sign*.15;}}
    else if(variant%3===0)mesh(chest,box(),pants,.073,.249,-.125,.062,.075,.012);
  }
  const arms=[],legs=[];
  if(type===0){for(const s of [-1,1]){ell(chest,'#d56b96',s*.136,.25,.107,.015,.11,.015);}}
  for(const s of [-1,1]){
    const arm=joint(chest,s*.173,.385,.005); arm.rotation.z=s*.105;
    ell(arm,beach?skin:sleeveTone,s*.007,-.032,0,.073,.103,.076);mesh(arm,cap(),beach||shortSleeves?skin:sleeveTone,0,-.119,0,.133,.208,.128);
    if(shortSleeves)mesh(arm,cap(),jacket,0,-.074,0,.143,.118,.136);
    const elbow=joint(arm,0,-.234,0);mesh(elbow,cap(),beach||shortSleeves?skin:sleeveTone,0,-.085,0,.121,.144,.123);
    mesh(elbow,cy(),beach||shortSleeves?skin:sleeveTone,0,-.169,.001,.098,.052,.094);
    if(extra&&!beach&&!extra.uniform&&variant%3===2&&s===-1){const watch=mesh(elbow,cy(),'#42313e',0,-.172,0,.062,.027,.060);watch.castShadow=false;ell(elbow,'#ccad7e',.027,-.170,-.025,.012,.018,.016);}
    const wrist=joint(elbow,0,-.185,.002);ell(wrist,skin,0,-.028,0,.031,.045,.024);
    ell(wrist,skin,s*.023,-.037,-.011,.013,.022,.012).rotation.z=s*.32;
    ell(wrist,skin,0,-.060,-.002,.025,.022,.022);
    arms.push({arm,elbow,s,wrist});
    const thigh=joint(hips,s*.092,-.059,.012);mesh(thigh,cap(),beach?skin:pants,0,-.18,0,.174,.294,.174);if(beach)mesh(thigh,cap(),pants,0,-.081,0,.186,.19,.182);
    const knee=joint(thigh,0,-.398,-.012);mesh(knee,cap(),beach?skin:pants,0,-.183,.012,.147,.279,.15);
    const ankle=joint(knee,0,-.382,0);ell(ankle,beach?skin:'#342c40',0,-.046,-.058,.078,.065,.134);ell(ankle,'#dcb0b8',0,-.080,-.059,.079,.020,.135);legs.push({thigh,knee,ankle});
  }
  let step=0;const originalJacket=mat(jacket),originalPants=mat(pants),closet=[];
  root.traverse(o=>{if(o.material===originalJacket||o.material===originalPants)closet.push([o,o.material===originalJacket]);});
  return {root,outfit(option){for(const [o,top] of closet)o.material=option.colors?mat(`rgb(${(top?option.colors.jacket:option.colors.pants).join(',')})`):(top?originalJacket:originalPants);},animate(dt,stride,sprint=0,acting){
    step+=dt*(6+4*sprint);const wave=Math.sin(step), bob=Math.cos(step*2),hurt=acting?.hurt||0;const blend=1-Math.exp(-13*dt);
    const soften=(o,k,v)=>{o[k]+=(v-o[k])*blend;};
    soften(rig.position,'y',(-bob*.022+.013)*stride+Math.sin(step*.4)*.006-hurt*.19);soften(rig.rotation,'x',-stride*(.035+.14*sprint)+hurt*.32);
    soften(hips.rotation,'y',wave*.086*stride);soften(chest.rotation,'y',-wave*.15*stride);soften(chest.rotation,'z',wave*.035*stride);soften(head.rotation,'y',wave*.025*stride);
    soften(tail.rotation,'x',wave*.17*stride);soften(tail.rotation,'z',Math.sin(step*.8)*.2*stride);
    face?.(step/6,dt,acting);const embrace=acting?.embrace||0;const emphasis=acting?.speaking?(Math.sin((acting.beat??step*.16)*2.6)**2)*(.30+(acting.voice??.2)*.70):0,seated=Boolean(acting?.seated),driver=Boolean(acting?.driver);
    soften(rig.rotation,'z',seated?Math.sin(step*.41)*.012:0);
    if(acting){soften(chest.rotation,'y',(acting.look??0)*.045+Math.sin(step*.22)*.023);soften(chest.rotation,'x',acting.lean||Math.sin(step*.18)*.014);}else soften(chest.rotation,'x',0);
    arms.forEach(({arm,elbow,s,wrist},i)=>{const p=i===0?wave:-wave;soften(arm.rotation,'x',seated?(driver?.89:.26)+(driver?.04:.24)*emphasis:-p*(.37+.32*sprint)*stride-emphasis*(i===0?.24:.08)+embrace*(i===0?.78:.24));soften(arm.rotation,'z',s*(seated?(driver?-.18:.04):.09+.05*stride+emphasis*.07));soften(elbow.rotation,'x',seated?(driver?.66:.99)+emphasis*(driver?.07:.34):-.12-stride*(.16+.62*sprint)+p*.08*stride-emphasis*(i===0?.6:.2)+embrace*(i===0?.48:.19));soften(wrist.rotation,'x',seated?-.13:-p*.09*stride+emphasis*.17);});
    legs.forEach(({thigh,knee,ankle},i)=>{const p=i===0?wave:-wave;const lift=Math.max(0,(i===0?Math.cos(step):-Math.cos(step)));soften(thigh.rotation,'x',seated?1.32:p*(.41+sprint*.18)*stride-lift*.17*stride-hurt*.45);soften(knee.rotation,'x',seated?-1.30:lift*(.75+sprint*.46)*stride+hurt*.78);soften(ankle.rotation,'x',(-lift*.31-p*.14)*stride);});
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

// Continuous swept cap. The hairline follows the temples instead of using spheres for bangs.
function sweptHair(){return geom('hero-swept-cap',()=>{
  const vertices=[],colors=[],indices=[],n=48,m=15,base=new T.Color('#302027');
  for(let j=0;j<=m;j++)for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,front=(1+Math.cos(a))*.5,r=j/m;
    const span=2.37-front**2*1.24+.16*Math.sin(a+.30)*front**5;
    const angle=.007+r*span,az=a+(1-r)*.47,flow=1+.015*Math.sin(i*1.7+r*4);
    vertices.push(Math.sin(az)*Math.sin(angle)*.103*flow,1.664+Math.cos(angle)*.122,Math.cos(az)*Math.sin(angle)*.106*flow-.018);
    const tint=.9+.13*Math.sin(i*1.2+r*2)+.10*Math.sin(a*7+r*4);colors.push(base.r*tint,base.g*tint,base.b*tint);
    const k=j*n+i,next=j*n+(i+1)%n;if(j)indices.push(k,next,k-n,next,next-n,k-n);
  }
  const g=new T.BufferGeometry();g.setIndex(indices);g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
});}

// Rigged, continuous-skin hero with blended authored locomotion clips.
export function riggedPerson(asset,{accent=null,male=false,performance=false,uniform=false,crowd=null}={}){
  const actor=new T.Group(), visual=asset.clone(asset.scene), head=visual.getObjectByName('Head');
  visual.updateMatrixWorld(true);
  const hair=new T.Group();visual.add(hair);
  const pony=joint(hair,0,1.716,-.091);
  if(!male){
    const cap=new T.Mesh(sweptHair(),new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide}));cap.castShadow=true;hair.add(cap);
    ell(pony,'#302027',-.01,-.069,-.036,.040,.098,.045).rotation.x=.38;
    ell(pony,'#302027',.008,-.143,-.071,.030,.080,.032).rotation.z=.23;
    const hoops=geom('hero-hoop',()=>new T.TorusGeometry(.016,.0030,8,16));
    for(const side of [-1,1])mesh(hair,hoops,'#d9a375',side*.095,1.604,.009).rotation.y=side*.42;
  }
  head?.attach(hair);
  visual.rotation.y=Math.PI;actor.add(visual);
  visual.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    if(o.material.name.startsWith('MI_Hair_')){o.material=o.material.clone();o.material.color.set('#3f2926');}
    if(accent&&o.material.name==='MI_Superhero_Female'){o.material=o.material.clone();o.material.color.set(accent);}
    if(crowd&&o.material.name.startsWith('MI_Superhero_')){
      o.material=o.material.clone();const tint=new T.Color(crowd.color);const skin=new T.Color(crowd.skin);
      o.material.customProgramCacheKey=()=>'mare-crowd-v2';
      o.material.onBeforeCompile=shader=>{
        shader.uniforms.crowdTint={value:tint};shader.uniforms.crowdSkin={value:skin};
        shader.vertexShader='varying vec3 crowdRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncrowdRest=position;');
        shader.fragmentShader='varying vec3 crowdRest;uniform vec3 crowdTint,crowdSkin;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          vec3 q=crowdRest;bool clothed=q.y<1.52&&abs(q.x)<.68;
          if(clothed&&q.y>.98){float d=dot(diffuseColor.rgb,vec3(.22,.68,.10));diffuseColor.rgb=mix(diffuseColor.rgb,crowdTint*(.56+d*.76),.83);}
          else if(!clothed)diffuseColor.rgb*=crowdSkin;`);
      };
    }
    if(uniform&&o.material.name==='MI_Superhero_Male'){
      o.material=o.material.clone();o.material.customProgramCacheKey=()=> 'miragem-uniform-v1';
      o.material.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec3 miragemRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmiragemRest=position;');
        shader.fragmentShader='varying vec3 miragemRest;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          vec3 q=miragemRest;
          if(q.y<1.585&&abs(q.x)<.743){
            float detail=dot(diffuseColor.rgb,vec3(.21,.71,.08));
            diffuseColor.rgb=mix(vec3(.044,.057,.072),vec3(.096,.117,.132),clamp(detail*2.6,0.,1.));
            if(abs(q.y-1.33)<.021&&abs(q.x-.123)<.033&&q.z>.08)diffuseColor.rgb=vec3(.31,.22,.11);
            if(abs(q.y-1.01)<.030)diffuseColor.rgb*=.47;
          }`);
      };
    }
  });
  let outfitMesh;visual.traverse(o=>{if(o.isSkinnedMesh&&o.material.name==='MI_Superhero_Female')outfitMesh=o;});
  const originalMap=outfitMesh?.material.map, maps=new Map();
  if(outfitMesh&&!accent)outfitMesh.material=outfitMesh.material.clone();
  function changeOutfit(option){
    if(!outfitMesh||!originalMap?.image||accent)return;
    if(option.id==='miragem-stage'&&asset.miragemMap){outfitMesh.material.map=asset.miragemMap;outfitMesh.material.needsUpdate=true;return;}
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
  const eyeGaze={value:new T.Vector2()};
  const eyeMesh=visual.getObjectByName('Eyes');
  const hasEyeMap=Boolean(eyeMesh?.material?.map);
  if(hasEyeMap){
    eyeMesh.material=eyeMesh.material.clone();
    eyeMesh.material.customProgramCacheKey=()=> 'mare-eye-tracking-v2';
    eyeMesh.material.onBeforeCompile=shader=>{
      shader.uniforms.eyeGaze=eyeGaze;
      shader.vertexShader='varying float eyeSide;\n'+shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\neyeSide = sign(position.x);');
      shader.fragmentShader='uniform vec2 eyeGaze; varying float eyeSide;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
        #ifdef USE_MAP
        vec2 irisCenter = vec2(0.5);
        // Opposite UV offsets on a mirrored atlas move both pupils the same way on the face.
        vec2 shift = eyeGaze.x * eyeSide * vec2(${eyeAtlasBasis.horizontal.join(',')}) * .044
                   + eyeGaze.y * vec2(${eyeAtlasBasis.vertical.join(',')}) * .020;
        vec2 iris = vMapUv - irisCenter;
        float follow = 1.0 - smoothstep(.15, .245, length(iris));
        vec4 sampledDiffuseColor = texture2D(map, vMapUv + (iris * .10 - shift) * follow);
        diffuseColor *= sampledDiffuseColor;
        #endif`);
    };
  }
  let faceMesh,brows;const neck=visual.getObjectByName('neck_01');
  if(performance)visual.traverse(o=>{
    if(!o.isSkinnedMesh)return;
    if(o.name==='Eyebrows'){
      brows=o;o.geometry=o.geometry.clone();const p=o.geometry.attributes.position,pressure=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){const x=Math.abs(p.getX(i));pressure[i*3+1]=.007-.18*(x-.016);}
      o.geometry.morphAttributes.position=[new T.Float32BufferAttribute(pressure,3)];o.geometry.morphTargetsRelative=true;o.updateMorphTargets();
    }
    if(!o.material.name.startsWith('MI_Superhero_'))return;
    faceMesh=o;o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,uv=o.geometry.attributes.uv,delta=new Float32Array(pos.count*3),blink=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){
      const u=uv.getX(i),v=uv.getY(i),x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      if(y>1.50&&y<1.66&&z>.038&&Math.abs(u-.185)<.063&&v>.252&&v<.343){
        const weight=Math.max(0,1-Math.abs(x)/.042)**.7*Math.sin(Math.PI*T.MathUtils.clamp((v-.252)/.091,0,1));
        delta[i*3+1]=weight*(v<.269?.0023:-.021);delta[i*3+2]=weight*-.005;
      }
      if(y>(male?1.673:1.628)&&z>.051&&u>.078&&u<.292&&v>.146&&v<.197&&Math.abs(x)>.012){
        const lid=Math.sin(Math.PI*T.MathUtils.clamp((v-.146)/.051,0,1));blink[i*3+1]=(v<.178?-.015:.007)*lid;
      }
    }
    o.geometry.morphAttributes.position=[new T.Float32BufferAttribute(delta,3),new T.Float32BufferAttribute(blink,3)];o.geometry.morphTargetsRelative=true;o.updateMorphTargets();
  });
  const mixer=new T.AnimationMixer(visual), clips=Object.fromEntries(asset.animations.map(c=>[c.name,mixer.clipAction(c)]));
  let current=clips.Idle_Loop, oneShot=null,clock=0,faceTurn=0,faceTilt=0,combo=0;current?.play();
  const upper=['upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','thigh_l','thigh_r','calf_l','calf_r','spine_01'].map(n=>visual.getObjectByName(n));
  const neutralLegs=upper.slice(4,8).map(b=>b?.quaternion.clone());
  const hands=['hand_l','hand_r'].map(n=>visual.getObjectByName(n));
  const lightProp=hands[1]&&joint(hands[1],.021,.018,.027),pulseProp=hands[1]&&joint(hands[1],.020,.012,.024);
  if(lightProp){
    mesh(lightProp,cy(),'#363443',0,0,.032,.048,.14,.049).rotation.x=Math.PI/2;
    mesh(lightProp,cy(),'#aca5a4',0,0,.096,.068,.029,.068).rotation.x=Math.PI/2;
    mesh(lightProp,cy(),'#ffe1ab',0,0,.111,.049,.006,.049,true).rotation.x=Math.PI/2;lightProp.visible=false;
  }
  if(pulseProp){
    mesh(pulseProp,cap(),'#384757',0,.015,.061,.071,.127,.087).rotation.x=Math.PI/2;
    ell(pulseProp,'#83c1bd',0,.019,.127,.026,.023,.021);ell(pulseProp,'#e6a273',0,.048,.068,.026,.010,.028);
    pulseProp.visible=false;
  }
  const jointA=new T.Vector3(),jointB=new T.Vector3(),jointC=new T.Vector3(),goal=new T.Vector3(),axis=new T.Vector3(),elbow=new T.Vector3(),pole=new T.Vector3(),localA=new T.Vector3(),localB=new T.Vector3();
  let flight=0,idleTime=0,idleMix=0;const axisZ=new T.Vector3(0,0,1),headBase=head?.quaternion.clone(),neckBase=neck?.quaternion.clone(),axisY=new T.Vector3(0,1,0),axisX=new T.Vector3(1,0,0),pose=new T.Quaternion();
  const oneShots=new Set(['Interact','Jump_Start','Jump_Land','ClimbUp_1m','Punch_Cross','Punch_Jab','Pistol_Shoot']);
  for(const name of oneShots){if(clips[name]){clips[name].setLoop(T.LoopOnce,1);clips[name].clampWhenFinished=true;}}
  function activate(name,force=false){const next=clips[name];if(!next||next===current&&!force)return;const last=current;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();if(last!==next)last?.crossFadeTo(next,oneShots.has(name)?.10:.23,false);current=next;}
  function swingTo(bone,end,target){
    const parent=bone.parent;localA.copy(end);localB.copy(target);parent.worldToLocal(localA).sub(bone.position).normalize();parent.worldToLocal(localB).sub(bone.position).normalize();
    bone.quaternion.premultiply(pose.setFromUnitVectors(localA,localB));bone.updateWorldMatrix(false,true);
  }
  const shoulderPose=new T.Quaternion(),forearmPose=new T.Quaternion();
  function grip(targets,weight=1){
    actor.updateMatrixWorld(true);
    for(let i=0;i<2;i++){
      const shoulder=upper[i],forearm=upper[i+2],hand=hands[i];if(!targets[i]||!shoulder||!forearm||!hand)continue;
      shoulder.getWorldPosition(jointA);forearm.getWorldPosition(jointB);hand.getWorldPosition(jointC);
      const swap=targets[0]&&targets[1]&&(i===0?jointA.distanceToSquared(targets[1])<jointA.distanceToSquared(targets[0]):upper[0].getWorldPosition(elbow).distanceToSquared(targets[1])<elbow.distanceToSquared(targets[0]));
      goal.copy(targets[swap?1-i:i]);axis.copy(goal).sub(jointA);const len=axis.length(),l1=jointA.distanceTo(jointB),l2=jointB.distanceTo(jointC);
      if(len<.02||l1<.03||l2<.03)continue;
      axis.divideScalar(len);const reach=T.MathUtils.clamp(len,Math.abs(l1-l2)+.012,l1+l2-.012),aim=(l1*l1+reach*reach-l2*l2)/(2*reach);
      pole.copy(jointB).sub(jointA);pole.addScaledVector(axis,-pole.dot(axis));if(pole.lengthSq()<.001)pole.set(0,-1,0).addScaledVector(axis,axis.y);
      goal.copy(jointA).addScaledVector(axis,reach);
      elbow.copy(jointA).addScaledVector(axis,aim).addScaledVector(pole.normalize(),Math.sqrt(Math.max(0,l1*l1-aim*aim)));
      shoulderPose.copy(shoulder.quaternion);forearmPose.copy(forearm.quaternion);
      swingTo(shoulder,jointB,elbow);hand.getWorldPosition(jointC);swingTo(forearm,jointC,goal);
      if(weight<1){shoulder.quaternion.slerp(shoulderPose,1-weight);forearm.quaternion.slerp(forearmPose,1-weight);}
    }
  }
  function play(name,seconds){if(!clips[name])return;oneShot={name,time:seconds??clips[name].getClip().duration};activate(name,true);if(seconds)current.setEffectiveTimeScale(current.getClip().duration/seconds);}
  return {root:actor,handWorld(side,result){return hands[side]?.getWorldPosition(result)||actor.getWorldPosition(result);},outfit:changeOutfit,disposeOutfits(){for(const t of maps.values())t.dispose();if(hasEyeMap)eyeMesh.material.dispose();}, animate(dt,stride,sprint=0,talking=false){
    clock+=dt;const acting=typeof talking==='object'?talking:null;
    followEyeGaze(eyeGaze.value,dt,acting,Math.sin(Math.floor(clock*2.4+(male?.7:0))*2.399));
    if(lightProp)lightProp.visible=acting?.hold==='torch'&&!acting?.air;
    if(pulseProp)pulseProp.visible=(acting?.hold==='pulse'||oneShot?.name==='Pistol_Shoot')&&!acting?.air;
    const action=oneShot?.name||(acting?.swim?(stride>.08?'Swim_Fwd_Loop':'Swim_Idle_Loop'):acting?.jet?'Driving_Loop':acting?.seated?(acting.speaking?'Sitting_Talking_Loop':'Sitting_Idle_Loop'):acting?.air?'Jump_Loop':acting?.crouch?(stride>.09?'Crouch_Fwd_Loop':'Crouch_Idle_Loop'):acting?.hold==='torch'?(stride>.08?'Walk_Carry_Loop':'Idle_Torch_Loop'):acting?.hold==='case'&&stride>.07?'Walk_Carry_Loop':acting?.hold==='pulse'&&stride<.07?'Pistol_Aim_Neutral':stride<.068?(acting?.gesture?'Idle_Talking_Loop':acting?.foldArms?'Idle_FoldArms_Loop':'Idle_Loop'):sprint>.66?'Sprint_Loop':sprint>.2?'Jog_Fwd_Loop':'Walk_Loop');
    activate(action);if(action==='Walk_Loop'||action==='Crouch_Fwd_Loop')current.setEffectiveTimeScale(acting?.sneakWalk?.68:.69+stride*.42);if(action==='Sprint_Loop'||action==='Jog_Fwd_Loop')current.setEffectiveTimeScale(.85+sprint*.13);
    if(oneShot&&(oneShot.time-=dt)<=0)oneShot=null;
    pony.rotation.x=.09*Math.sin(clock*11)*stride;pony.rotation.z=.13*Math.sin(clock*9)*stride;mixer.update(dt);
    const activePose=acting?.canopy?3:acting?.fall?2:acting?.brace?1:0;
    flight+=(activePose-flight)*(1-Math.exp(-dt*(activePose===1?8:5.4)));
    const low=Math.max(0,1-Math.abs(flight-1)),dive=Math.max(0,1-Math.abs(flight-2)),hung=Math.max(0,1-Math.abs(flight-3));
    if(flight>.01){
      upper[8]?.quaternion.multiply(pose.setFromAxisAngle(axisX,low*.29+dive*.16));
      for(let i=0;i<2;i++){
        upper[i]?.quaternion.multiply(pose.setFromAxisAngle(axisX,(i?1:-1)*(dive*(.64+(acting?.reach||0)*(i?.60:-.28))+hung*1.40)));
        upper[i+2]?.quaternion.multiply(pose.setFromAxisAngle(axisX,(i?1:-1)*(dive*.36+hung*.42)));
        upper[i+4]?.quaternion.multiply(pose.setFromAxisAngle(axisX,low*.33+hung*.14));
        upper[i+6]?.quaternion.multiply(pose.setFromAxisAngle(axisX,-low*.53-dive*.21-hung*.29));
      }
    }
    if(acting?.scene&&!acting?.seated&&!acting?.fall&&!acting?.canopy&&stride<.10){for(let i=0;i<4;i++)if(neutralLegs[i])upper[i+4].quaternion.slerp(neutralLegs[i],.40);}
    if(acting?.jet){
      for(let i=0;i<2;i++){upper[i]?.quaternion.multiply(pose.setFromAxisAngle(axisZ,(i?1:-1)*(acting.steer||0)*.19));upper[i+4]?.quaternion.multiply(pose.setFromAxisAngle(axisX,.12));}
      upper[8]?.quaternion.multiply(pose.setFromAxisAngle(axisZ,(acting.steer||0)*.12));
      if(acting.grips)grip(acting.grips);
    }
    if(acting?.reachHand?.weight>.01){const {point,side,weight}=acting.reachHand;grip(side===0?[point,null]:[null,point],weight);}
    if(acting?.vaultSupport)grip([null,acting.vaultSupport],acting.contactWeight);
    if(performance){
      const ease=1-Math.exp(-dt*9),talk=acting?.speaking?(acting.voice||0):0;
      if(brows){const fear=acting?.mood==='fear',tension=fear?1:acting?.mood==='tense'?-.52:0;const w=brows.morphTargetInfluences;w[0]+=(tension-w[0])*ease;}
      const idle=stride<.06&&!acting?.speaking&&!activePose&&!oneShot;
      idleMix+=((idle?1:0)-idleMix)*ease;if(idle)idleTime+=dt;else if(idleMix<.025)idleTime=0;
      const idleBeat=idlePerformance(idleTime+(male?1.95:0),male),scan=idleBeat.yaw*idleMix;
      if(idleMix>.01){
        upper[8]?.quaternion.multiply(pose.setFromAxisAngle(axisZ,idleBeat.lean*idleMix)).multiply(pose.setFromAxisAngle(axisX,idleBeat.breath*idleMix));
        const sleeve=male?1:0,side=male?1:-1;
        upper[sleeve]?.quaternion.multiply(pose.setFromAxisAngle(axisX,side*idleBeat.cuff*.26*idleMix));
        upper[sleeve+2]?.quaternion.multiply(pose.setFromAxisAngle(axisX,-side*idleBeat.cuff*.58*idleMix));
      }
      faceTurn+=((acting?.look||0)*.69+scan-faceTurn)*ease;faceTilt+=((acting?.pitch||0)+idleBeat.tilt*idleMix-faceTilt)*ease;
      // Blend back toward the character's own neutral head, retaining a little authored motion.
      if(head&&headBase)head.quaternion.slerp(headBase,acting?.scene?.80:.64).multiply(pose.setFromAxisAngle(axisY,faceTurn)).premultiply(pose.setFromAxisAngle(axisX,faceTilt)).multiply(pose.setFromAxisAngle(axisZ,acting?.headTilt||0));
      if(neck&&neckBase)neck.quaternion.slerp(neckBase,.33).multiply(pose.setFromAxisAngle(axisY,faceTurn*.25));
      if(faceMesh){const blinkPhase=(clock+(male?1.4:0)+Math.sin(clock*.47)*.37)%3.71;const open=faceMesh.morphTargetInfluences;open[0]+=(Math.min(1,talk*(acting?.mood==='fear'?1.47:1.16))-open[0])*(1-Math.exp(-dt*20));open[1]=Math.max(acting?.eyeClose||0,acting?.scene?.035:0,1-Math.abs(blinkPhase-3.46)/.105);}
    }
  },interact(){play('Interact',.56);},jump(){play('Jump_Start',.23);},land(){play('Jump_Land',.32);},vault(seconds){play('ClimbUp_1m',seconds);},attack(ranged){play(ranged?'Pistol_Shoot':(++combo%2?'Punch_Jab':'Punch_Cross'),ranged?.32:.44);}};
}
