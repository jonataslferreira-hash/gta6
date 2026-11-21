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
  const orb=new T.SphereGeometry(1,22,14),box=new T.BoxGeometry(),bolt=new T.CylinderGeometry(.034,.034,.024,8);
  // Hull chine and deck use shaped cross sections instead of overlapping spheres.
  function shell(sections,material){
    const verts=[],faces=[],n=16;
    sections.forEach(([z,w,middle,depth,deck],i)=>{for(let j=0;j<n;j++){
      const a=j/n*2*Math.PI,y=Math.cos(a);
      verts.push(Math.sin(a)*w,middle+y*(y>0?deck:depth),z);
      if(i){const m=i*n+j,k=i*n+(j+1)%n;faces.push(m,k,m-n,k,k-n,m-n);}
    }});
    for(let j=1;j<n-1;j++)faces.push(0,j+1,j, (sections.length-1)*n,(sections.length-1)*n+j,(sections.length-1)*n+j+1);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(faces);g.computeVertexNormals();return node(g,material,0,0,0);
  }
  shell([[-1.68,.03,.13,.10,.04],[-1.44,.26,.10,.18,.07],[-.90,.46,.04,.23,.105],[-.37,.55,.02,.23,.13],[.58,.54,.01,.21,.12],[1.15,.43,.03,.16,.08],[1.31,.27,.04,.13,.04]],navy);
  shell([[-1.55,.065,.16,.035,.06],[-1.29,.28,.16,.04,.135],[-.75,.44,.16,.06,.24],[-.34,.49,.14,.035,.21],[.60,.49,.13,.045,.11],[1.26,.32,.13,.07,.038]],pink);
  node(orb,cream,0,.305,-.78,.28,.12,.62);node(orb,navy,0,.392,-.58,.25,.07,.27);
  const seat=node(orb,black,0,.33,.31,.27,.117,.64);seat.rotation.x=.08;
  for(let i=0;i<6;i++)node(box,navy,0,.425,.17+i*.09,.43,.012,.018);
  const column=node(orb,navy,0,.47,-.63,.118,.33,.135);column.rotation.x=.31;
  const bar=new T.Group();bar.position.set(0,.74,-.55);body.add(bar);
  const fitting=node(box,chrome,0,0,0,.66,.033,.047);bar.add(fitting);
  const grips=[];
  for(const side of [-1,1]){
    const grip=node(box,black,side*.302,.014,.032,.17,.052,.07);bar.add(grip);grips.push(grip);
    for(let i=0;i<6;i++)node(box,i%2?navy:black,side*.39,.172,i*.105+.035,.125,.025,.089);
    for(let i=0;i<4;i++)node(bolt,chrome,side*.346,.225,.037+i*.267);
    node(orb,cream,side*.30,.225,-.63,.115,.032,.52).rotation.y=side*.16;
  }
  node(orb,black,0,.80,-.62,.116,.024,.054);node(box,cream,0,.814,-.627,.10,.012,.02);
  const nozzle=node(new T.CylinderGeometry(.10,.12,.15,12,1,true),chrome,0,.034,1.28);nozzle.rotation.x=Math.PI/2;
  const targets=grips.map(()=>new T.Vector3());
  const plume=new T.Shape();plume.moveTo(-.40,0);plume.quadraticCurveTo(-.14,.26,.22,.14);plume.quadraticCurveTo(.46,.06,.40,-.10);plume.quadraticCurveTo(.10,-.22,-.40,0);
  const foam=new T.InstancedMesh(new T.ShapeGeometry(plume,7),new T.MeshBasicMaterial({color:'#e2e8e9',transparent:true,opacity:.38,depthWrite:false}),24);
  const life=new Float32Array(24),points=Array.from(life,()=>new T.Vector3());const dummy=new T.Object3D();scene.add(foam);foam.frustumCulled=false;let since=0,index=0;
  return {root,riderHeight:-.52,get lean(){return body.rotation.z;},get steer(){return bar.rotation.y;},grips(){return grips.map((g,i)=>g.getWorldPosition(targets[i]));},update(dt,v,side,clock){
    bar.rotation.y=damp(bar.rotation.y,side*.36,8.5,dt);
    root.position.y=.032+Math.sin(clock*3.1+root.position.x*.12)*(.029+Math.abs(v)*.0025);body.rotation.x=damp(body.rotation.x,-Math.abs(v)*.010+Math.sin(clock*3.7)*.036,4.1,dt);body.rotation.z=damp(body.rotation.z,side*.22*Math.min(1,Math.abs(v)/4),4.5,dt);
    since+=dt;if(Math.abs(v)>2&&since>.077){since=0;const a=root.rotation.y,x=root.position.x,z=root.position.z;for(const dir of [-1,1]){const i=index++%24;points[i].set(x+Math.sin(a)*1.3+dir*.29*Math.cos(a),-.174,z+Math.cos(a)*1.3-dir*.29*Math.sin(a));life[i]=1;}}
    for(let i=0;i<24;i++){life[i]=Math.max(0,life[i]-dt*.69);dummy.position.copy(points[i]);dummy.rotation.set(-Math.PI/2,0,i*.81);const f=life[i];dummy.scale.set(f>0?.2+f*.87:0,f>0?1.7-f:0,1);dummy.updateMatrix();foam.setMatrixAt(i,dummy.matrix);}foam.instanceMatrix.needsUpdate=true;foam.visible=life.some(x=>x>0);
  }};
}
