import * as T from 'three';
export const jetskiDock={x:255.7,z:66};
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function jetStep(p,yaw,v,throttle,steer,brake,dt){
  const speed=damp(v,brake?0:throttle<0?throttle*3:throttle*17,brake?2.9:throttle?.82:.57,dt);
  const heading=yaw-steer*clamp(Math.abs(speed)/3,0,1)*Math.sign(speed)*1.24*dt;
  const x=clamp(p.x-Math.sin(heading)*speed*dt,255.2,645),z=clamp(p.z-Math.cos(heading)*speed*dt,-480,479);
  return {x,z,yaw:heading,speed:x<=255.2||x>=645||Math.abs(z)>=479?speed*.79:speed};
}
export function makeJetSki(scene){
  const root=new T.Group(), body=new T.Group();root.add(body);scene.add(root);root.position.set(jetskiDock.x,.04,jetskiDock.z);root.rotation.y=-Math.PI/2;
  const mat=(color,roughness=.4)=>new T.MeshStandardMaterial({color,roughness,metalness:.13});
  const navy=mat('#344052'),pink=mat('#ac4677'),cream=mat('#ead1ac'),black=mat('#211f2b',.87),chrome=mat('#898fa5');
  function node(geo,material,x,y,z,w=1,h=1,d=1){const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(w,h,d);body.add(o);return o;}
  const orb=new T.SphereGeometry(1,20,10),box=new T.BoxGeometry();
  node(orb,navy,0,-.015,-.14,.56,.19,1.46);node(orb,pink,0,.12,-.21,.52,.18,1.4);node(orb,cream,0,.22,-.69,.35,.13,.81);node(orb,black,0,.31,.28,.26,.125,.64);
  const column=node(box,navy,0,.46,-.72,.18,.57,.18);column.rotation.x=.27;node(box,chrome,0,.73,-.67,.63,.049,.059);
  for(const side of [-1,1]){node(orb,black,side*.29,.74,-.67,.104,.036,.036);node(box,black,side*.41,.17,.42,.119,.034,.65);}
  const foam=new T.InstancedMesh(new T.PlaneGeometry(.8,.40),new T.MeshBasicMaterial({color:'#e2e8e9',transparent:true,opacity:.38,depthWrite:false}),24);
  const life=new Float32Array(24),points=Array.from(life,()=>new T.Vector3());const dummy=new T.Object3D();scene.add(foam);foam.frustumCulled=false;let since=0,index=0;
  return {root,update(dt,v,side,clock){
    root.position.y=.032+Math.sin(clock*3.1+root.position.x*.12)*(.029+Math.abs(v)*.0025);body.rotation.x=damp(body.rotation.x,-Math.abs(v)*.010+Math.sin(clock*3.7)*.036,4.1,dt);body.rotation.z=damp(body.rotation.z,side*.22*Math.min(1,Math.abs(v)/4),4.5,dt);
    since+=dt;if(Math.abs(v)>2&&since>.077){since=0;const a=root.rotation.y,x=root.position.x,z=root.position.z;for(const dir of [-1,1]){const i=index++%24;points[i].set(x+Math.sin(a)*1.3+dir*.29*Math.cos(a),-.174,z+Math.cos(a)*1.3-dir*.29*Math.sin(a));life[i]=1;}}
    for(let i=0;i<24;i++){life[i]=Math.max(0,life[i]-dt*.69);dummy.position.copy(points[i]);dummy.rotation.set(-Math.PI/2,0,i*.81);const f=life[i];dummy.scale.set(f>0?.2+f*.87:0,f>0?1.7-f:0,1);dummy.updateMatrix();foam.setMatrixAt(i,dummy.matrix);}foam.instanceMatrix.needsUpdate=true;foam.visible=life.some(x=>x>0);
  }};
}
