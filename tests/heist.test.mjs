import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
import {makeHeist,casinoLoot,casinoSite,glideStep} from '../src/heist.js';
import {mapProjection,streetRoute,zoomMap} from '../src/navigation.js';
import {cityClock,DAY_SECONDS} from '../src/daylight.js';
import {casinoVoices} from '../src/casino-voices.js';
import {casinoAlarm,casinoDrop,casinoEntry,casinoSearch,streetDialogue} from '../src/casino-dialogue.js';
import {openingDolly,openingSeconds,indoorRoute} from '../src/miragem-direction.js';
import {idlePerformance} from '../src/idle-performance.js';
import {chuteWait,dropLine} from '../src/miragem.js';
import {existsSync} from 'node:fs';

test('the playable prologue goes from stealth to the case, alarm, rooftop and landing',()=>{
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(),runner={root:new T.Group(),animate(){}};let alarm=0,land,release;
  const dropLines=[],ally={root:new T.Group(),animate(){}};
  const h=makeHeist(scene,{runner,ally,announce(){},selectHint(){},onDrop(i,done){dropLines.push(i);done?.();},onAlarm(center,end){alarm++;assert(center.y>350);release=end;},onLand(value){land=value;}});
  const input=(side=0,forward=0)=>({side,forward,yaw:0,elevation:0,crouch:true});
  const advance=(input,condition,n=1600)=>{while(n--&&!condition())h.update(.025,input,cam);assert(condition(),`phase=${h.phase} pos=${runner.root.position.toArray()}`);};
  assert.equal(h.phase,'title');assert.equal(h.interact(),false);advance(input(),()=>h.phase==='arrival');advance(input(),()=>h.phase==='stealth');
  assert.equal(h.interact(),false,'the fuse and list cannot be skipped');
  const go=(x,z)=>{const p=runner.root.position; for(let i=0;i<1200;i++){const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.25)return;h.update(.025,input(dx/d,-dz/d),cam);}assert.fail(`Unreachable: ${x}, ${z} from ${p.toArray()}`);};
  for(const [index,route] of [
    [[3.50,12.45]],[[4.65,19.2],[4.64,24.2],[-4.59,24.2],[-4.55,27.2]],
    [[-4.59,24.2],[4.64,24.2],[4.64,12.4],[-1.90,12.25],[-1.86,5.25],[3.28,5.25]],
    [[0,5.25],[0,-4.4],[-1.52,-4.52]],
  ].entries()){h.update(.025,input(),cam);assert(h.waypoints.length>4,`route available at stage ${index}`);assert(h.direction.meters>0);for(const step of route)go(...step);advance(input(),()=>ally.root.position.distanceTo(runner.root.position)<2.8,300);assert(h.interactable);assert(h.interact());}
  assert.equal(alarm,1);assert.equal(h.phase,'alarm');const held=runner.root.position.clone();h.update(.1,input(),cam);assert(held.equals(runner.root.position));assert(runner.root.visible);
  release();assert.equal(h.phase,'escape');h.update(.025,input(),cam);assert(h.waypoints.length>4);h.action('Pulso neon');
  advance(input(1,0),()=>runner.root.position.x>-.55);
  advance(input(0,1),()=>runner.root.position.z<-10.4);assert(h.jump());
  assert.equal(h.phase,'air');assert.equal(h.jump(),false);
  for(let i=0;i<Math.round((chuteWait-.2)/.025);i++)h.update(.025,input(),cam);
  assert.equal(h.jump(),false);assert.deepEqual(dropLines,[0,3]);
  advance(input(),()=>dropLines.includes(1));assert(h.jump());
  const startX=runner.root.position.x;for(let i=0;i<64;i++)h.update(.025,input(1,1),cam);
  assert(runner.root.position.x>startX+3,'chute steering actually displaces the runner');
  advance(input(),()=>h.phase==='land');assert(runner.root.visible);
  advance(input(),()=>h.phase==='complete');assert(land.x>dropLine.x+6);assert(land.z<dropLine.z-6);
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
  for(const [,line] of [...casinoEntry,...casinoSearch,...casinoAlarm,...casinoDrop,...streetDialogue]){
    assert(casinoVoices[line]);assert(existsSync(new URL(`../public/voices/${casinoVoices[line]}`,import.meta.url)));
  }
});

test('wheel zoom preserves the map point below the pointer',()=>{
  const xs=[-654,204],zs=[-300,492],can=[720,570,xs,zs],u=488,v=271;
  const first=mapProjection(...can).pick(u,v),view=zoomMap(...can,null,u,v,-245),zoomed=mapProjection(...can,null,view);
  assert(view.zoom>1);assert(Math.abs(zoomed.x(first.x)-u)<.00001&&Math.abs(zoomed.z(first.z)-v)<.00001);
  assert.equal(zoomMap(...can,view,u,v,245),null);
});

test('opening dolly starts in front of both actors and hands off at the exact gameplay offset',()=>{
  const lead={x:-1.8,z:12.7},mate={x:-1.2,z:12.2},yaw=.12,pitch=.24;
  const first=openingDolly(0,lead,mate,yaw,pitch),last=openingDolly(openingSeconds,lead,mate,yaw,pitch);
  assert(first.z<lead.z&&first.z<mate.z);assert(first.fov<last.fov);assert(first.lx>lead.x&&first.lx<mate.x);
  assert.equal(last.lx,lead.x);assert.equal(last.lz,lead.z);
  assert(Math.abs(last.x-lead.x-Math.sin(yaw)*2.18-Math.cos(yaw)*.58)<.01);
  assert(Math.abs(last.z-lead.z-Math.cos(yaw)*2.18+Math.sin(yaw)*.58)<.01);
  let prev=first;
  for(let t=.025;t<=openingSeconds;t+=.025){const now=openingDolly(t,lead,mate,yaw,pitch);assert(Math.hypot(now.x-prev.x,now.y-prev.y,now.z-prev.z)<.08);prev=now;}
});

test('indoor guidance bends through an open doorway rather than the dividing wall',()=>{
  const blocked=(x,z,r)=>Math.abs(z-4)<.24+r&&!(x>2+r&&x<4.5-r);
  const route=indoorRoute({x:0,z:7},{x:0,z:1,radius:.8},blocked);
  assert(route.length>18);assert(route.some(p=>Math.abs(p.z-4)<.3&&p.x>2.33));
  assert(route.every(p=>!blocked(p.x,p.z,.33)));
});

test('both leads have distinct idle gestures with smooth neutral handoffs',()=>{
  assert.notEqual(idlePerformance(4.1,false).yaw,idlePerformance(4.1,true).yaw);
  assert(idlePerformance(15,false).cuff>.8);assert(idlePerformance(9,false).lean>.06);
  assert.equal(idlePerformance(17.35,false).cuff,0);
});
