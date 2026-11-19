export const CAR_HALF_WIDTH=1.08;
export const CAR_HALF_LENGTH=2.17;
const CELL=18;
export function carShape(x,z,yaw){return {x,z,w:CAR_HALF_WIDTH*2,d:CAR_HALF_LENGTH*2,yaw};}
function axes(yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return [c,-s,s,c];}
export function boxesOverlap(a,b){
  const [ax,az,af,ag]=axes(a.yaw),[bx,bz,bf,bg]=axes(b.yaw);
  const dx=b.x-a.x,dz=b.z-a.z,aw=a.w/2,ad=a.d/2,bw=b.w/2,bd=b.d/2;
  const c=Math.abs(ax*bx+az*bz),s=Math.abs(ax*bf+az*bg);
  return Math.abs(dx*ax+dz*az)<aw+bw*c+bd*s &&
    Math.abs(dx*af+dz*ag)<ad+bw*s+bd*c &&
    Math.abs(dx*bx+dz*bz)<bw+aw*c+ad*s &&
    Math.abs(dx*bf+dz*bg)<bd+aw*s+ad*c;
}
export function circleBox(x,z,r,box){
  const [ax,az,af,ag]=axes(box.yaw),dx=x-box.x,dz=z-box.z;
  const xx=Math.max(0,Math.abs(dx*ax+dz*az)-box.w/2),zz=Math.max(0,Math.abs(dx*af+dz*ag)-box.d/2);
  return xx*xx+zz*zz<r*r;
}
function span(box){const [ux,uz,vx,vz]=axes(box.yaw);return [Math.abs(ux)*box.w/2+Math.abs(vx)*box.d/2,Math.abs(uz)*box.w/2+Math.abs(vz)*box.d/2];}
export function createCollision(obstacles,bounds){
  const spatial=new Map();const cell=(x,z)=>`${x},${z}`;
  function each(x,z,w,d,fn){for(let i=Math.floor((x-w)/CELL);i<=Math.floor((x+w)/CELL);i++)for(let j=Math.floor((z-d)/CELL);j<=Math.floor((z+d)/CELL);j++)if(fn(cell(i,j)))return true;return false;}
  for(const box of obstacles){const [w,d]=span(box);each(box.x,box.z,w,d,k=>{if(!spatial.has(k))spatial.set(k,[]);spatial.get(k).push(box);});}
  const outside=(x,z,w,d)=>x-w<bounds.minX||x+w>bounds.maxX||z-d<bounds.minZ||z+d>bounds.maxZ;
  const collision=(x,z,w,d,test)=>outside(x,z,w,d)||each(x,z,w,d,k=>spatial.get(k)?.some(test));
  return {
    circle(x,z,r,camera=false){return collision(x,z,r,r,box=>(!camera||box.camera!==false)&&circleBox(x,z,r,box));},
    vehicle(x,z,yaw){const car=carShape(x,z,yaw),[w,d]=span(car);return collision(x,z,w,d,box=>boxesOverlap(car,box));},
  };
}
export function sweepVehicle(position,oldYaw,newYaw,dx,dz,blocked){
  const diff=Math.atan2(Math.sin(newYaw-oldYaw),Math.cos(newYaw-oldYaw));
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.29),Math.ceil(Math.abs(diff)/.095));
  const x=position.x,z=position.z;let yaw=oldYaw;
  for(let i=1;i<=count;i++){
    const t=i/count,nx=x+dx*t,nz=z+dz*t,heading=oldYaw+diff*t;
    if(blocked(nx,nz,heading))return {yaw,hit:true};
    position.x=nx;position.z=nz;yaw=heading;
  }
  return {yaw,hit:false};
}
