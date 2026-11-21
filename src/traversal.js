export const shore={enter:255.15,exit:254.65,east:644,north:-479,south:479};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function swimStep(p,heading,amount,dt){
  const speed=clamp(amount,0,1)*2.25;
  return {x:clamp(p.x-Math.sin(heading)*speed*dt,shore.exit,shore.east),z:clamp(p.z-Math.cos(heading)*speed*dt,shore.north,shore.south)};
}
export function vaultTarget(p,yaw,rails,blocked){
  const dx=-Math.sin(yaw),dz=-Math.cos(yaw);
  for(const rail of rails){
    const distance=rail.axis==='x'?(rail.x-p.x)/dx:(rail.z-p.z)/dz;
    if(!Number.isFinite(distance)||distance<.18||distance>1.26)continue;
    const cross=rail.axis==='x'?p.z+dz*distance-rail.z:p.x+dx*distance-rail.x;
    if(Math.abs(cross)>rail.length*.5-.27)continue;
    if((rail.axis==='x'?Math.abs(dx):Math.abs(dz))<.72)continue;
    const x=p.x+dx*(distance+.78),z=p.z+dz*(distance+.78);
    if(!blocked(x,z,.37)){
      const height=rail.height||.88;
      const palm=clamp(cross+(rail.axis==='x'?-dx:dz)*.20,-rail.length/2+.10,rail.length/2-.10);
      return {x,z,height,support:{x:rail.axis==='x'?rail.x:rail.x+palm,y:height+.045,z:rail.axis==='x'?rail.z+palm:rail.z}};
    }
  }
  return null;
}
