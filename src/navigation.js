export function mapProjection(width,height,xs,zs,focus=null,viewport=null){
  const minX=xs[0]-18,maxX=257,minZ=zs[0]-18,maxZ=zs.at(-1)+17;
  const scale=focus?1.05:Math.min((width-24)/(maxX-minX),(height-24)/(maxZ-minZ))*(viewport?.zoom||1);
  const cx=focus?.x??viewport?.x??(minX+maxX)/2,cz=focus?.z??viewport?.z??(minZ+maxZ)/2;
  return {scale,cx,cz,x:x=>width/2+(x-cx)*scale,z:z=>height/2+(z-cz)*scale,pick(u,v){return {x:Math.max(minX,Math.min(maxX,cx+(u-width/2)/scale)),z:Math.max(minZ,Math.min(maxZ,cz+(v-height/2)/scale))};}};
}
export function streetRoute(from,to,xs,zs){
  const near=(n,points)=>points.reduce((a,b)=>Math.abs(n-a)<=Math.abs(n-b)?a:b);
  const ax=near(from.x,xs),az=near(from.z,zs),bx=near(to.x,xs),bz=near(to.z,zs);
  const approach=(p,x,z)=>Math.abs(p.x-x)<Math.abs(p.z-z)?{x,z:p.z}:{x:p.x,z};
  const first=approach(from,ax,az),last=approach(to,bx,bz);
  return [from,first,{x:ax,z:az},{x:ax,z:bz},{x:bx,z:bz},last,to];
}

export function zoomMap(width,height,xs,zs,previous,u,v,delta){
  const old=mapProjection(width,height,xs,zs,null,previous), zoom=Math.max(1,Math.min(7,(previous?.zoom||1)*Math.exp(-Math.max(-240,Math.min(240,delta))*.0022)));
  if(zoom<=1.001)return null;
  const peg={x:old.cx+(u-width/2)/old.scale,z:old.cz+(v-height/2)/old.scale},scale=old.scale*zoom/(previous?.zoom||1);
  return {zoom,x:peg.x-(u-width/2)/scale,z:peg.z-(v-height/2)/scale};
}
