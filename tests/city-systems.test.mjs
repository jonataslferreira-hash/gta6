import assert from 'node:assert/strict';
import {test} from 'node:test';
import {jetStep} from '../src/watercraft.js';
import {starsFor,wantedStep,cleanWanted} from '../src/wanted.js';
import {stationPosition} from '../src/radio-clock.js';

test('radio stations run virtual timelines even when not selected',()=>{
  assert.deepEqual(stationPosition([40,25,32],52),{index:1,offset:12});
  assert.deepEqual(stationPosition([40,25,32],104),{index:0,offset:7});
});
test('stars do not decay in sight, and are lost while unobserved',()=>{
  let s=wantedStep(cleanWanted(),.1,{incident:1.80});assert.equal(starsFor(s.heat),2);
  for(let i=0;i<150;i++)s=wantedStep(s,.2,{seen:true});assert.equal(starsFor(s.heat),2);
  for(let i=0;i<150;i++)s=wantedStep(s,.2);assert.equal(starsFor(s.heat),0);
  assert.equal(starsFor(wantedStep(s,60,{floor:2}).heat),2);
});
test('the jet ski accelerates with inertia and stays in the navigable ocean',()=>{
  let s={x:258,z:65,yaw:-Math.PI/2,speed:0};
  for(let n=0;n<100;n++)s=jetStep(s,s.yaw,s.speed,1,0,false,.05);
  assert(s.x>310&&s.speed>14);
  const edge=jetStep({x:256,z:65},Math.PI/2,12,1,0,false,.4);assert.equal(edge.x,255.2);assert(edge.speed<13);
});
