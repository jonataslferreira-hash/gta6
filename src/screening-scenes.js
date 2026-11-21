import * as T from 'three';
import { directionTo } from './missions.js';

const ease=(a,b,t)=>T.MathUtils.smootherstep(t,a,b);
const V=(x,y,z)=>new T.Vector3(x,y,z);
export const afterHoursLines=[
  ['Nara','Fica mais um pouco? A gente não precisa falar do trabalho agora.'],
  ['Luzia','Fico. Só de você pedir assim, já valeu a noite.'],
];
const shots={
  kiosk:[
    [0,'geral',[-3.7,1.96,4.65],[-2.8,1.76,3.8],[.12,1.15,-.12],41],
    [2.35,'davi',[-1.12,1.61,1.63],[-.81,1.64,1.40],[.43,1.53,-.01],35],
    [8.7,'chave',[.07,1.36,1.04],[.17,1.34,.91],[.08,1.124,-.03],32],
    [11.33,'luzia',[1.23,1.59,1.65],[1.04,1.61,1.38],[-.47,1.51,-.04],36],
    [18.2,'saida',[-2.45,1.70,3.41],[-2.91,1.84,3.96],[.20,1.17,-.21],43],
  ],
  afterHours:[
    [0,'dois',[2.8,1.81,3.25],[2.24,1.70,2.7],[0,1.28,0],36],
    [1.5,'nara',[-1.01,1.60,1.41],[-.90,1.60,1.28],[.40,1.52,0],33],
    [6.4,'luzia',[1.04,1.64,1.42],[.94,1.62,1.29],[-.46,1.50,0],34],
    [11.4,'aproximacao',[-.06,1.62,2.02],[.04,1.60,1.61],[0,1.52,-.04],37],
    [14.17,'beijo',[.02,1.55,1.58],[.20,1.58,1.71],[0,1.56,-.02],34],
    [15.4,'reacao',[.39,1.59,1.67],[.51,1.60,1.87],[.015,1.48,0],36],
    [16.75,'desfecho',[.54,1.59,2.12],[.70,1.64,2.32],[0,1.43,.01],38],
  ],
};
export const screeningDuration={kiosk:22,afterHours:18.65};
export const streetScenes={
  kiosk:{x:217.35,y:.125,z:31.1,yaw:-Math.PI/2,title:'Quiosque 06',place:'Ocean Beach'},
  afterHours:{x:-50.1,y:.125,z:90.8,yaw:-Math.PI/2,title:'Depois do expediente',place:'Café Sereia · Calçada'},
};
export function shotFor(kind,t){return shots[kind].findLast(s=>t>=s[0])||shots[kind][0];}
export function createScreening(kind,cast,outfit,scene){
  const site=streetScenes[kind],stage=new T.Group();
  stage.position.set(site.x,site.y,site.z);stage.rotation.y=site.yaw;scene.add(stage);
  const camera=new T.PerspectiveCamera(40,1,.09,930),kiss=kind==='afterHours';
  const lamp=(color,intensity,x,y,z)=>{const l=new T.PointLight(color,intensity,5,2);l.position.set(x,y,z);stage.add(l);};
  lamp('#ffd0af',6.5,-.95,2.19,1.32);lamp('#aac4fa',4.5,1.65,2.47,-.8);
  const keyring=new T.Group();stage.add(keyring);
  const props=[];
  function detail(geometry,color,x,y,z,metalness){
    const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.34,metalness}));
    m.position.set(x,y,z);keyring.add(m);props.push(m);return m;
  }
  if(!kiss){
    detail(new T.TorusGeometry(.038,.005,8,20),'#d9ad70',0,0,0,.82);
    detail(new T.BoxGeometry(.017,.067,.008),'#d9c2a0',0,-.045,.002,.89);
    detail(new T.BoxGeometry(.029,.048,.013),'#493945',.024,-.048,.014,.47);
  }
  const luz=cast.Luzia(),partner=(kiss?cast.Nara:cast.Davi)();luz.outfit?.(outfit);
  stage.add(luz.root,partner.root);
  const target=V(0,0,0),from=V(0,0,0),to=V(0,0,0);
  const leftGrip=V(-.05,1.12,.015),rightGrip=V(.07,1.12,.03),offered=V(0,0,0),received=V(0,0,0);
  const round=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t));
  function act(t,dt,caption,voice){
    const p=luz.root.position,q=partner.root.position;
    if(kiss){
      const part=ease(16.70,17.64,t);
      const close=ease(11.05,14.15,t),feet=ease(11.0,13.51,t),move=round(t,10.97,11.4,12.7,13.55),tilt=ease(13.29,14.23,t)*(1-part);
      p.set(-.72+feet*.475+tilt*.105-part*.07,0,.075-tilt*.042);q.set(.62-feet*.373-tilt*.111+part*.07,0,-.072+tilt*.025);
      luz.root.rotation.set(0,directionTo(p,q)+.19*(1-close),tilt*.035);
      partner.root.rotation.set(0,directionTo(q,p)-.17*(1-close),-tilt*.041);
      const hand=round(t,12.1,13.6,16,17),eyes=ease(13.5,14.17,t)*(1-part);
      luz.animate(dt,move*.43,0,{scene:true,speaking:caption==='Luzia',voice,gesture:caption==='Luzia',eye:.18,look:.13*(1-close),pitch:-tilt*.06,headTilt:-tilt*.15,eyeClose:eyes,reachHand:{point:stage.localToWorld(rightGrip.copy(q).add(V(-.12,1.14,-.125))),side:1,weight:hand*.79}});
      partner.animate(dt,move*.35,0,{scene:true,speaking:caption==='Nara',voice,gesture:caption==='Nara',look:-.18*(1-close),pitch:-tilt*.04,headTilt:tilt*.13,eyeClose:eyes,beat:t,embrace:hand});
    }else{
      const k=t-1.55;
      const arrive=ease(.05,2.42,t),exit=ease(18.5,21.63,t),transfer=ease(7.25,8.35,k),offer=round(k,5.9,7.21,8.6,9.4);
      p.set(-1.43+arrive*.91,0,.46-arrive*.48);q.set(.61+exit*2.2,0,-.12-exit*.64);
      luz.root.rotation.y=directionTo(p,q)+.18*(1-arrive);
      partner.root.rotation.y=directionTo(q,p)-2.8*ease(18.1,18.7,t);
      const glance=round(t,2.7,3.39,4.67,5.37),take=round(k,7.15,8.04,8.71,9.53),tv=round(t,3.02,3.6,4.13,4.57);
      leftGrip.set(-.03,1.14,.025);rightGrip.set(.10,1.14,.024);
      keyring.visible=k>5.95&&k<9.63;
      keyring.rotation.set(.4,.31+t*.24,.13+transfer*.48);
      luz.animate(dt,round(t,0,.4,1.77,2.42)*.55,0,{scene:true,gesture:caption==='Luzia',speaking:caption==='Luzia',voice,look:-.29*glance,pitch:take*.13,eye:-.66*glance,mood:'tense',reachHand:{point:stage.localToWorld(leftGrip),side:0,weight:take}});
      partner.animate(dt,round(t,18.35,18.85,21.5,22)*.55,0,{scene:true,gesture:caption==='Davi',speaking:caption==='Davi',voice,look:.41*tv,pitch:offer*.13,eye:.73*tv,mood:'tense',reachHand:{point:stage.localToWorld(rightGrip),side:1,weight:offer}});
      // Follow the actual skinned wrist; the keys never hang between unconnected targets.
      if(keyring.visible){
        const a=partner.handWorld?.(1,offered)||offered.copy(rightGrip),b=luz.handWorld?.(0,received)||received.copy(leftGrip);
        stage.worldToLocal(keyring.position.copy(a).lerp(b,transfer));keyring.position.y-=.054;keyring.position.z+=.027;
      }
    }
    return kiss?ease(17.76,18.58,t):ease(21.0,21.95,t);
  }
  function frame(t,aspect){
    const seq=shots[kind],s=shotFor(kind,t),next=seq[seq.indexOf(s)+1]?.[0]??screeningDuration[kind];
    const u=ease(s[0],next,t);from.fromArray(s[2]);to.fromArray(s[3]);
    camera.position.copy(stage.localToWorld(from.lerp(to,u)));stage.localToWorld(target.fromArray(s[4]));
    camera.aspect=aspect;camera.fov=aspect<1?Math.min(s[5]+15,65):s[5];camera.lookAt(target);camera.updateProjectionMatrix();return s[1];
  }
  return {stage,camera,act,frame,dispose(){
    scene.remove(stage);
    for(const a of [luz,partner])a.disposeOutfits?.();
    for(const m of props){m.geometry.dispose();m.material.dispose();}
  }};
}
