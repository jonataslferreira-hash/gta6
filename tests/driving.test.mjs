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
  assert.equal(getawayRoute.length,7);
  assert.equal(advanceGetaway(0,{distance:8,speed:10,inCar:true}),0);
  assert.equal(advanceGetaway(0,{distance:3,speed:10,inCar:true}),1);
  assert.equal(advanceGetaway(1,{distance:2,speed:10,inCar:true}),2);
  assert.equal(advanceGetaway(5,{distance:1,speed:10,inCar:true}),5);
  assert.equal(advanceGetaway(5,{distance:1,speed:.15,inCar:true}),6);
  assert.equal(advanceGetaway(6,{distance:1,speed:0,inCar:false}),7);
});
