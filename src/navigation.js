export function mapProjection(width,height,xs,zs,focus=null){
  const minX=xs[0]-18,maxX=257,minZ=zs[0]-18,maxZ=zs.at(-1)+17;
  const scale=focus?1.05:Math.min((width-24)/(maxX-minX),(height-24)/(maxZ-minZ));
  const cx=focus?.x??(minX+maxX)/2,cz=focus?.z??(minZ+maxZ)/2;
  return {scale,x:x=>width/2+(x-cx)*scale,z:z=>height/2+(z-cz)*scale,pick(u,v){return {x:Math.max(minX,Math.min(maxX,cx+(u-width/2)/scale)),z:Math.max(minZ,Math.min(maxZ,cz+(v-height/2)/scale))};}};
}
export function streetRoute(from,to,xs,zs){
  const near=(n,points)=>points.reduce((a,b)=>Math.abs(n-a)<=Math.abs(n-b)?a:b);
  const ax=near(from.x,xs),az=near(from.z,zs),bx=near(to.x,xs),bz=near(to.z,zs);
  const approach=(p,x,z)=>Math.abs(p.x-x)<Math.abs(p.z-z)?{x,z:p.z}:{x:p.x,z};
  const first=approach(from,ax,az),last=approach(to,bx,bz);
  return [from,first,{x:ax,z:az},{x:ax,z:bz},{x:bx,z:bz},last,to];
}
