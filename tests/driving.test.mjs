import assert from 'node:assert/strict';
import {test} from 'node:test';
import {driveStep} from '../src/driving.js';
import {advanceGetaway,cleanState,getawayRoute} from '../src/getaway.js';
import {createCollision} from '../src/collision.js';

const input={throttle:1,side:0,brake:false,sand:false};
test('weight builds, and braking stops sooner than coasting',()=>{
  const p={x:0,z:0};let next=driveStep(p,0,0,cleanState(),input,.2,()=>false);
  assert(next.speed>0&&next.speed<1.5);
  for(let i=0;i<24;i++)next=driveStep(p,next.yaw,next.speed,next,input,.10,()=>false);
  const brake=driveStep({...p},next.yaw,next.speed,next,{...input,brake:true},.2,()=>false);
  const coast=driveStep({...p},next.yaw,next.speed,next,{...input,throttle:0},.2,()=>false);
  assert(brake.speed<coast.speed);assert(coast.speed>0);
});
test('substeps stop a high-speed car before a thin wall',()=>{
  const p={x:0,z:0};const world=createCollision([{x:0,z:-4,w:16,d:.16}],{minX:-25,maxX:25,minZ:-25,maxZ:25});
  const r=driveStep(p,0,22,{steer:0,vx:0,vz:-22},input,.24,world.vehicle);
  assert(r.impact>8);assert(!world.vehicle(p.x,p.z,r.yaw));assert(p.z>-1.79);
});
test('the tutorial requires gates, stopping and exiting in order',()=>{
  const stop=getawayRoute.length-2;
  const length=getawayRoute.slice(1).reduce((sum,b,i)=>sum+Math.hypot(b.x-getawayRoute[i].x,b.z-getawayRoute[i].z),0);
  assert(length>860);
  assert.equal(advanceGetaway(0,{distance:8,speed:10,inCar:true}),0);
  assert.equal(advanceGetaway(0,{distance:3,speed:10,inCar:true}),1);
  assert.equal(advanceGetaway(1,{distance:2,speed:10,inCar:true}),2);
  assert.equal(advanceGetaway(stop,{distance:1,speed:10,inCar:true}),stop);
  assert.equal(advanceGetaway(stop,{distance:1,speed:.15,inCar:true}),stop+1);
  assert.equal(advanceGetaway(stop+1,{distance:1,speed:0,inCar:false}),stop+2);
});
test('acceleration crosses gears with a cut in drive force',()=>{
  const p={x:0,z:0};let next={...cleanState(),yaw:0,speed:0},sawShift=false;
  for(let i=0;i<230;i++){
    next=driveStep(p,next.yaw,next.speed,next,input,.042,()=>false);
    if(next.shift>0){assert(next.acceleration<2);sawShift=true;}
  }
  assert(sawShift);assert(next.gear>=3);assert(next.rpm>1000&&next.rpm<=5900);
});
