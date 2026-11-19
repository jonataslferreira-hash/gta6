import { sweepVehicle } from './collision.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const blend=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
function substep(p,yaw,speed,dynamics,input,dt,blocked){
  const {throttle,side,brake,sand}=input;
  const magnitude=Math.abs(speed),target=throttle>0?throttle*(sand?13.5:27):throttle*5.4,opposite=target*speed<0;
  const up=[0,6.5,11.5,17.2,23.4,270],down=[0,0,4.1,8.5,13.5,18.6];
  let gear=dynamics.gear||1,shift=Math.max(0,(dynamics.shift||0)-dt);
  if(!shift&&speed>=-.14){if(magnitude>up[gear]){gear++;shift=.23;}else if(gear>1&&magnitude<down[gear]){gear--;shift=.17;}}
  if(speed<-.14)gear=1;
  const rpm=blend(dynamics.rpm||850,Math.max(850,Math.min(5900,1010+magnitude*[0,684,362,255,194,161][gear]+Math.max(0,throttle)*760)),shift>0?4.2:8.2,dt);
  const driveForce=(sand?2.72:4.6)*(shift>0?.31:1)*(1-.30*Math.min(1,magnitude/27));
  const accel=brake?12.4:opposite?9.4:throttle===0?(sand?2.9:.68+magnitude*.067):driveForce;
  const previous=speed;speed+=clamp((brake?0:target)-speed,-accel*dt,accel*dt);
  const steer=blend(dynamics.steer,side,Math.abs(speed)>12?6.2:9.5,dt);
  const turn=-steer*Math.sign(speed)*clamp(Math.abs(speed)/5.5,0,1)*(brake?1.95:1.54)/(1+Math.abs(speed)*.028);
  const heading=yaw+turn*dt;
  const sideways=Math.cos(heading)*dynamics.vx-Math.sin(heading)*dynamics.vz;
  const slip=blend(sideways,0,brake?2.4:sand?4.0:8.5,dt);
  let vx=-Math.sin(heading)*speed+Math.cos(heading)*slip;
  let vz=-Math.cos(heading)*speed-Math.sin(heading)*slip;
  const x=p.x,z=p.z, moved=sweepVehicle(p,yaw,heading,vx*dt,vz*dt,blocked);
  let impact=0;
  if(moved.hit){
    const leftX=vx*dt-(p.x-x),leftZ=vz*dt-(p.z-z);const stable=moved.yaw;
    const xFree=Math.abs(leftX)>.0001&&!blocked(p.x+leftX,p.z,stable),zFree=Math.abs(leftZ)>.0001&&!blocked(p.x,p.z+leftZ,stable);
    const useX=xFree&&(!zFree||Math.abs(leftX)>=Math.abs(leftZ)),useZ=zFree&&!useX;
    if(useX)p.x+=leftX;else if(useZ)p.z+=leftZ;
    impact=Math.hypot(useX?0:vx,useZ?0:vz);vx=useX?vx*.77:0;vz=useZ?vz*.77:0;
    speed=-Math.sin(stable)*vx-Math.cos(stable)*vz;
  }
  return {yaw:moved.yaw,speed,impact,steer,vx,vz,gear,shift,rpm,acceleration:(speed-previous)/dt};
}

export function driveStep(p,yaw,speed,dynamics,input,dt,blocked){
  const count=Math.max(1,Math.ceil(dt/.042));let state={...dynamics,yaw,speed},impact=0;
  for(let i=0;i<count;i++){state=substep(p,state.yaw,state.speed,state,input,dt/count,blocked);impact=Math.max(impact,state.impact);}
  return {...state,impact};
}
