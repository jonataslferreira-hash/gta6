import { sweepVehicle } from './collision.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const blend=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
function substep(p,yaw,speed,dynamics,input,dt,blocked){
  const {throttle,side,brake,sand}=input;
  const target=throttle>0?throttle*(sand?12:23):throttle*5.8,opposite=target*speed<0;
  const accel=brake?13:opposite?9.6:throttle===0?(sand?3.3:1.3):sand?2.8:4.5;
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
  return {yaw:moved.yaw,speed,impact,steer,vx,vz,acceleration:(speed-previous)/dt};
}

export function driveStep(p,yaw,speed,dynamics,input,dt,blocked){
  const count=Math.max(1,Math.ceil(dt/.042));let state={...dynamics,yaw,speed},impact=0;
  for(let i=0;i<count;i++){state=substep(p,state.yaw,state.speed,state,input,dt/count,blocked);impact=Math.max(impact,state.impact);}
  return {...state,impact};
}
