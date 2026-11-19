import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boxesOverlap, carShape, circleBox, createCollision, sweepVehicle } from '../src/collision.js';
import { stationAt } from '../src/radio-wheel.js';

test('the nose of a car reaches a wall before its center does', () => {
  const wall = {x:0, z:-4, w:8, d:.2};
  const c = createCollision([wall], {minX:-18, maxX:18, minZ:-18, maxZ:18});
  const p = {x:0, z:0};
  const result = sweepVehicle(p,0,0,0,-9,c.vehicle);
  assert.equal(result.hit,true);
  assert(p.z < -1.2 && p.z >= -1.73);
  assert(!c.vehicle(p.x,p.z,result.yaw));
});

test('a car cannot turn its corner through a parked car', () => {
  const a = carShape(0,0,0), b = carShape(2.30,0,0);
  assert.equal(boxesOverlap(a,b),false);
  assert.equal(boxesOverlap(carShape(0,0,Math.PI/4),b),true);
  const result = sweepVehicle({x:0,z:0},0,Math.PI/3,0,0,(x,z,h)=>boxesOverlap(carShape(x,z,h),b));
  assert.equal(result.hit,true);
  assert(result.yaw < Math.PI/3);
});

test('pedestrian cannot cross props but the camera ignores decorative posts', () => {
  const c = createCollision([{x:18,z:18,w:1,d:6,yaw:Math.PI/4,camera:false}],{minX:-40,maxX:40,minZ:-40,maxZ:40});
  assert(c.circle(18.18,19.1,.5));
  assert(!c.circle(18.18,19.1,.5,true));
  assert(!circleBox(3,3,.3,carShape(0,0,0)));
});

test('radial station selection is clockwise from the top', () => {
  assert.equal(stationAt(3,2,5),null);
  assert.equal(stationAt(0,-100,5),0);
  for(let i=0;i<5;i++)assert.equal(stationAt(Math.sin(i*2*Math.PI/5)*100,-Math.cos(i*2*Math.PI/5)*100,5),i);
});
