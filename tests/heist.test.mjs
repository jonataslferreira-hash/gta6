import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
import {makeHeist,casinoLoot,casinoSite,glideStep} from '../src/heist.js';
import {mapProjection,streetRoute} from '../src/navigation.js';
import {cityClock,DAY_SECONDS} from '../src/daylight.js';
import {casinoVoices} from '../src/casino-voices.js';
import {casinoAlarm,casinoDrop,streetDialogue} from '../src/casino-dialogue.js';
import {existsSync} from 'node:fs';

test('the playable prologue goes from stealth to the case, alarm, rooftop and landing',()=>{
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(),runner={root:new T.Group(),animate(){}};let alarm=0,land;
  const h=makeHeist(scene,{runner,announce(){},selectHint(){},onDrop(){},onAlarm(center,end){alarm++;assert(center.y>20);end();},onLand(value){land=value;}});
  const input=(side=0,forward=0)=>({side,forward,yaw:0,elevation:0,crouch:true});
  const advance=(input,condition,n=1100)=>{while(n--&&!condition())h.update(.025,input,cam);assert(condition(),`phase=${h.phase} pos=${runner.root.position.toArray()}`);};
  assert.equal(h.phase,'title');assert.equal(h.interact(),false);advance(input(),()=>h.phase==='stealth');
  advance(input(0,1),()=>runner.root.position.z<casinoLoot.z+1.1);
  advance(input(-1,0),()=>runner.root.position.x<casinoLoot.x+1.4);
  assert.equal(h.interact(),true);assert.equal(alarm,1);assert.equal(h.phase,'escape');
  h.action('Pulso neon');
  advance(input(0,1),()=>runner.root.position.z<-10.4);assert.equal(h.jump(),true);
  assert.equal(h.phase,'air');advance(input(),()=>runner.root.position.y<-11.65);assert.equal(h.jump(),true);
  advance(input(),()=>h.phase==='complete');assert(Math.abs(land.x-casinoSite.x)<3);assert(land.z<casinoSite.z-14);
});
test('the parachute slows descent without snapping the avatar to the ground',()=>{
  const fast=glideStep(12,-17,false,.15),chute=glideStep(12,-17,true,.15);
  assert(fast.y<chute.y&&chute.y<12);assert(chute.velocity<=-3.9);assert(chute.velocity>fast.velocity);
});
test('world coordinates round-trip through a responsive canvas projection',()=>{
  const xs=[-654,-588,-522,204],zs=[-300,96,162,492],p={x:208.3,z:89},target={x:-565,z:133};
  const projection=mapProjection(720,570,xs,zs),hit=projection.pick(projection.x(target.x),projection.z(target.z));
  assert(Math.abs(hit.x-target.x)<.001&&Math.abs(hit.z-target.z)<.001);
  const route=streetRoute(p,target,xs,zs);assert.deepEqual(route[0],p);assert.deepEqual(route.at(-1),target);
});
test('day and night transition slowly over a 20-minute cycle',()=>{
  assert.equal(DAY_SECONDS,1200);assert(cityClock(885).light>cityClock(270).light);
  assert(Math.abs(cityClock(10).light-cityClock(11).light)<.04);
  assert.equal(cityClock(DAY_SECONDS).time,cityClock(0).time);
});
test('cassino and ambient dialogue reference packaged portuguese recordings',()=>{
  for(const [,line] of [...casinoAlarm,...casinoDrop,...streetDialogue]){
    assert(casinoVoices[line]);assert(existsSync(new URL(`../public/voices/${casinoVoices[line]}`,import.meta.url)));
  }
});
