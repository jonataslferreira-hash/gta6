import * as T from 'three';
import { person, riggedPerson } from './actors.js';

export const castStyles={
  Luzia:{portrait:'luzia',type:0,skin:'#b8765c',hair:'#352336',jacket:'#ac4276',pants:'#392e49'},
  Davi:{portrait:'davi',type:1,skin:'#bb8668',hair:'#322632',jacket:'#3b6371',pants:'#43394d'},
  Nara:{portrait:'nara',type:1,skin:'#9b5d49',hair:'#352039',jacket:'#507868',pants:'#3c3352'},
};
export const miragemOutfit={id:'miragem-stage',colors:{jacket:[117,55,77],pants:[46,44,55]}};
const locations={
  casino:['CASINO MIRAGEM','SALÃO PRIVADO'],
  opening:['OCEAN BEACH','19:41 · DOMINGO'],
  meetup:['QUIOSQUE 06','O CARRO DA FUGA'],
  briefcase:['OFICINA DA ORLA','O QUE VEIO NA MALA'],
  cafe:['CAFÉ SEREIA','MESA DO FUNDO'],
  dock:['PORTO VIOLETA','A ENTREGA DA MADRUGADA'],
  tape:['CLUBE LÚMEN','LADO B'],
};
export const sceneLabel=id=>locations[id]||locations.meetup;
export function makeCinematics(scene,world,{asset=null,makeDavi=null}={}){
  const stage=new T.Group();stage.visible=false;scene.add(stage);
  const cast=Object.fromEntries(Object.entries(castStyles).map(([name,style])=>[name,person(style)]));
  const casinoCast={Luzia:asset?riggedPerson(asset,{performance:true}):person(castStyles.Luzia),Davi:makeDavi?.({performance:true})||person(castStyles.Davi)};
  for(const actor of [...Object.values(cast),...Object.values(casinoCast)])stage.add(actor.root);
  const workingCast=()=>place==='casino'?casinoCast:cast;
  const key=new T.PointLight('#ffd1b6',9.7,8,2), rim=new T.PointLight('#ff7ac9',13,8,2), fill=new T.PointLight('#8dd8ef',5.0,7,2);
  stage.add(key,rim,fill);
  const emergency=new T.PointLight('#ab182f',0,7,1.9);emergency.position.set(1.8,2.85,-2.15);stage.add(emergency);
  const evidence=new T.Group();stage.add(evidence);
  const shape=(parent,color,x,y,z,w,h,d,metalness=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.53,metalness}));m.position.set(x,y,z);parent.add(m);return m;};
  const bag=new T.Group(), lid=new T.Group(), deck=new T.Group();evidence.add(bag,deck);bag.add(lid);
  shape(bag,'#322638',0,.05,0,.49,.10,.34);shape(bag,'#ac8b7f',0,.100,0,.49,.024,.34,.47);
  lid.position.set(0,.111,.16);shape(lid,'#483148',0,.021,-.16,.49,.044,.34);shape(lid,'#785467',0,.046,-.16,.44,.011,.29);
  for(const x of [-.148,.148])shape(lid,'#ccab85',x,.018,-.343,.052,.037,.018,.63);
  shape(bag,'#251a29',0,.115,0,.43,.008,.27);shape(bag,'#d3aa91',.05,.119,-.024,.24,.006,.13).rotation.y=.22;
  shape(bag,'#554759',-.10,.123,.038,.145,.01,.091).rotation.y=-.24;shape(bag,'#d4b28e',-.10,.130,.038,.094,.005,.053).rotation.y=-.24;
  shape(deck,'#3d394a',0,.095,0,.54,.19,.37,.63);shape(deck,'#1e1425',0,.124,-.193,.26,.112,.009);
  shape(deck,'#bd8b88',0,.131,-.200,.173,.070,.008);shape(deck,'#443b54',0,.127,-.205,.134,.032,.008);
  const led=shape(deck,'#f75188',.182,.158,-.204,.022,.012,.010);led.material.emissive.set('#ff3972');led.material.emissiveIntensity=1.3;
  for(let i=0;i<4;i++)shape(deck,'#a2a0ad',-.14+.079*i,.194,-.087,.054,.013,.054,.5);
  const stand=shape(evidence,'#543345',0,-.48,0,.63,.91,.46);
  const a=new T.Vector3(), b=new T.Vector3(), at=new T.Vector3(), from=new T.Vector3();let ride=null;let place='opening',index=0,mood='',speaker='',age=0,shot='close',other='Davi',tag='Luzia',listenerMood='tense';
  const uniforms=world.sky.material.uniforms, twilight={top:new T.Color('#2a2c53'),bottom:new T.Color('#b66d96'),sunColor:new T.Color('#ffc5a4')};
  const normal={top:uniforms.top.value.clone(),bottom:uniforms.bottom.value.clone(),sunColor:uniforms.sunColor.value.clone(),night:uniforms.night.value,sun:world.sun.intensity,hemi:world.hemi.intensity};
  let gradeTransition=0;
  function restore(dt){
    if(gradeTransition<=0)return;gradeTransition=Math.max(0,gradeTransition-dt);const t=1-T.MathUtils.smoothstep(gradeTransition/3.5,0,1);
    world.sun.intensity=T.MathUtils.lerp(.64,normal.sun,t);world.hemi.intensity=T.MathUtils.lerp(1,normal.hemi,t);
    for(const k of ['top','bottom','sunColor'])uniforms[k].value.copy(twilight[k]).lerp(normal[k],t);uniforms.night.value=T.MathUtils.lerp(.7,normal.night,t);
  }
  function start(id,p,outfit,vehicle=null){
    gradeTransition=0;ride=vehicle;
    world.sun.intensity=.64;world.hemi.intensity=1;uniforms.top.value.copy(twilight.top);uniforms.bottom.value.copy(twilight.bottom);uniforms.sunColor.value.copy(twilight.sunColor);uniforms.night.value=.7;
    place=id;stage.visible=true;other=['cafe'].includes(place)?'Nara':'Davi';
    const heading=[0,Math.PI,Math.PI/2,-Math.PI/2].find(h=>[[-1.02,-2.3],[1.02,-2.3],[0,-2.65],[0,.18]].every(([x,z])=>!world.collides(p.x+Math.cos(h)*x+Math.sin(h)*z,p.z-Math.sin(h)*x+Math.cos(h)*z,.25,true)))||0;
    stage.position.set(p.x,id==='casino'?p.y:.125,p.z);stage.rotation.y=id==='casino'?0:heading;
    for(const [name,c] of Object.entries(cast))c.root.visible=place!=='casino'&&(name==='Luzia'||(name===other&&place!=='briefcase'));
    for(const c of Object.values(casinoCast))c.root.visible=place==='casino';
    cast.Luzia.outfit(outfit);cast.Luzia.root.position.set(-.37,0,0);cast.Luzia.root.rotation.y=-.30;
    cast[other].root.position.set(.40,0,.035);cast[other].root.rotation.y=.36;
    key.position.set(-.58,2.36,-1.38);rim.position.set(.58,1.89,.87);fill.position.set(1.52,1.42,-1.03);
    evidence.visible=['opening','briefcase','tape','dock'].includes(place);bag.visible=place!=='tape';deck.visible=!bag.visible;stand.visible=true;
    evidence.position.set(.01,.97,-.015);evidence.rotation.y=.16;lid.rotation.x=0;
    if(ride){
      cast.Luzia.root.position.set(-.36,-.48,.25);cast.Luzia.root.rotation.y=-.08;
      cast.Davi.root.position.set(.38,-.48,.29);cast.Davi.root.rotation.y=.12;
      key.position.set(-.24,1.46,-.91);rim.position.set(.48,1.53,.58);fill.position.set(.33,1.26,-.49);
      key.intensity=3.8;rim.intensity=1.4;fill.intensity=.45;
      evidence.position.set(.31,.82,-.02);evidence.scale.setScalar(.69);stand.visible=false;
    }else{key.intensity=9.7;rim.intensity=13;fill.intensity=5;evidence.scale.setScalar(1);}
    if(place==='casino'){
      world.hemi.intensity=.60;world.sun.intensity=.29;
      casinoCast.Luzia.outfit?.(outfit.id==='original'?miragemOutfit:outfit);
      casinoCast.Luzia.root.position.set(-.37,0,.02);casinoCast.Davi.root.position.set(.39,0,-.08);
      casinoCast.Luzia.root.rotation.y=-2.83;casinoCast.Davi.root.rotation.y=2.79;
      key.position.set(-.88,2.17,1.27);key.intensity=4.3;
      rim.position.set(.70,2.12,-1.07);rim.intensity=2.3;
      fill.position.set(1.58,1.84,.52);fill.intensity=1.4;
      evidence.visible=bag.visible=stand.visible=true;deck.visible=false;evidence.position.set(.80,.99,-.85);evidence.rotation.y=-.16;
    }else emergency.intensity=0;
    stage.updateMatrixWorld(true);
  }
  function line(next,i,emotion){
    speaker=next;index=i;mood=emotion;age=0;
    listenerMood=['fear','anger','shock'].includes(emotion)?'tense':'cold';
    tag=speaker==='Avelar'?'Luzia':speaker;
    shot=(['tape','briefcase'].includes(place)&&i===0)||(place==='opening'&&i===2)?'insert':i===0&&place!=='opening'?'pair':'close';
  }
  function frame(dt,cam,voice){
    age+=dt;
    if(ride){stage.position.copy(ride.position);stage.rotation.y=ride.rotation.y;}
    const performers=workingCast();
    for(const [name,c] of Object.entries(performers))if(c.root.visible){
      const driver=name==='Luzia',speaking=name===speaker;
      const glance=ride?(driver?(index===3?-.88:speaking?-.19:0):(index===4?.56:1)):(driver?-1:1);
      const lean=ride&&index>=3?(index===3?Math.sin(Math.min(Math.PI,age*2.8))*.13:.025):0;
      if(place==='casino'){
        const cross=driver?(index===0?.53:.68):(index===0&&age<2.2?-.56:-.45);
        const lookDoor=driver?age<1.0&&index===0:age>2.2&&index===0;
        const shift=index===1?T.MathUtils.smootherstep(age,2.0,3.25):0;
        c.root.position.x=(driver?-.37:.39)+(driver?.09:-.11)*shift;
        c.root.rotation.y=driver?-2.83+.18*shift:2.79-.15*shift;
        c.animate(dt,0,0,{speaking,voice,look:lookDoor?(driver?.84:.88):cross,pitch:lookDoor?-.14:(speaking?-.035:.07),gesture:speaking&&index===1&&age>2.4&&age<4.6,mood:speaking?mood:listenerMood,beat:age});
      }else c.animate(dt,0,0,{speaking,voice,mood:speaking?mood:listenerMood,look:glance,lean,beat:age,seated:!!ride,driver});
    }
    if(place==='casino')lid.rotation.x=1.06;
    if(place==='briefcase')lid.rotation.x=Math.min(1.63,age*2.7+index*1.63);
    if(place==='opening'&&index>=2)lid.rotation.x=Math.min(.45,age*1.1+(index-2)*.45);
    const drift=Math.sin(age*.8)*.025, push=Math.min(.12,age*.022),mobile=cam.aspect<.85;
    let active=shot==='insert'&&age>(place==='opening'?1.05:1.65)?(place==='opening'&&!mobile?'pair':'close'):shot;
    if(ride){
      const seat=cast[tag]?.root.position.x||0;
      if(index===0&&age<1.7){
        active='establishing';a.set(-4.1+age*.42,1.55+age*.16,-5.1+age*.61);b.set(.08,.73,-.22);cam.fov=43;
      }else if(index>=5){
        active='handoff';const p=T.MathUtils.smootherstep(age,0,2.0),theta=-1.04*(1-p),radius=4.15+4.05*p;
        a.set(Math.sin(theta)*radius,2.1+1.59*p,Math.cos(theta)*radius);b.set(0,.86+.34*p,-.25-2.1*p);cam.fov=45+18*p;
      }else if(index===3&&age<1.7){
        active='mirror';a.set(-3.6,2.45,-1.28);b.set(0,.92,6.4);cam.fov=48;
      }else{
        active='cockpit';a.set(seat*.42+drift*.18,1.22,-.51+push*.14);b.set(seat,1.11,.20);cam.fov=mobile?40:37;
      }
    }else if(place==='casino'){
      emergency.intensity=1.1+Math.sin((age+index*.86)*2.1)**2*5.4;
      if(index===0&&age<.82){
        active='tape';a.set(.46+push,1.54,.13);b.set(.81,1.08,-.85);cam.fov=mobile?41:35;
      }else if(index===0&&age>3.32&&age<4.36){
        active='door';a.set(.95+drift,1.42,.58);b.set(2.13,1.34,-2.82);cam.fov=mobile?36:39;
      }else if(index===1&&age>4.10&&!mobile){
        active='pair';a.set(.07+drift,1.55,2.06-push);b.set(.015,1.37,0);cam.fov=42;
      }else{
        active='reaction';const x=performers[tag].root.position.x;
        a.set(x+(tag==='Luzia'?-.23:.20)+drift,tag==='Luzia'?1.60:1.66,(mobile?1.44:1.31)-push);
        b.set(x+(mobile?0:tag==='Luzia'?.055:-.07),tag==='Luzia'?1.51:1.58,.04);cam.fov=mobile?36:40;
      }
    }else if(active==='insert'){
      a.set(.23,1.48,-.77+push);b.set(.003,1.03,-.018);cam.fov=42;
    }else if(active==='pair'&&!mobile){
      a.set(.05+drift,1.67,-1.77+push);b.set(.015,1.55,.008);cam.fov=38;
    }else{
      const x=cast[tag]?.root.position.x||0,s=tag==='Luzia'?-1:1;
      a.set(x-s*.23+drift,1.69,-(mobile?1.21:1.00)+push*.5);
      b.set(x+s*(mobile?.015:.09),1.61,.025);cam.fov=mobile?33:40;
    }
    stage.updateMatrixWorld(true);from.copy(stage.localToWorld(a));at.copy(stage.localToWorld(b));cam.position.copy(from);cam.lookAt(at);cam.updateProjectionMatrix();
    return active;
  }
  return {start,line,frame,restore,dispose(){for(const c of Object.values(casinoCast))c.disposeOutfits?.();},stop(smooth=false){stage.visible=false;ride=null;gradeTransition=3.5;if(!smooth)restore(3.5);}};
}
