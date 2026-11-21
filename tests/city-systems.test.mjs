import { Scene } from "three";
import { createWorld, XS, ZS } from "../src/world.js";
import { home } from "../src/district-services.js";
import { clearOfRoads,reserveRoad,reserveRoadDistance,makeUrbanRouter,openSpan } from "../src/urban-layout.js";
import { existsSync } from "node:fs";
import { makeStreetDialogues } from "../src/pedestrian-dialogue.js";
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {jetStep} from '../src/watercraft.js';
import {starsFor,wantedStep,cleanWanted} from '../src/wanted.js';
import {shore,swimStep,vaultTarget} from '../src/traversal.js';
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

test('swimming keeps the swimmer at the shore and ocean bounds',()=>{
  assert.equal(swimStep({x:255,z:65},Math.PI/2,1,2).x,shore.exit);
  assert.equal(swimStep({x:643,z:65},-Math.PI/2,1,2).x,shore.east);
  assert.equal(swimStep({x:263,z:65},0,1,2).z,60.5);
});
test('vault requires facing a low rail and a clear place to land',()=>{
  const rail={x:225.4,z:70,length:4.8,axis:'x',height:.87},p={x:224.5,z:70};
  const vault=vaultTarget(p,-Math.PI/2,[rail],()=>false);
  assert(vault.x>rail.x);
  assert.equal(vault.support.x,rail.x);
  assert(vault.support.y>rail.height&&Math.abs(vault.support.z-rail.z)<.3);
  assert.equal(vaultTarget(p,0,[rail],()=>false),null);
  assert.equal(vaultTarget(p,-Math.PI/2,[rail],()=>true),null);
});

test('pedestrian chatter cycles through recordings rather than repeating the same line',()=>{
  const choose=makeStreetDialogues(),seen=new Set();let prior;
  for(let i=0;i<12;i++){
    const [name,line,file]=choose('orla',i%2?'Beto':'Célia');
    assert.notEqual(line,prior);prior=line;seen.add(line);
    assert(name==='Beto'||name==='Célia');
    assert(existsSync(new URL(`../public/voices/${file}`,import.meta.url)));
  }
  assert.equal(seen.size,4);
  assert.notEqual(choose('transito')[1],choose('transito')[1]);
});

test('sidewalk furniture clears road lanes and reserve has diagonal segments',()=>{
  assert(!clearOfRoads(211.9,80,[204],[96]));
  assert(clearOfRoads(213.1,80,[204],[96]));
  assert(!clearOfRoads(213.1,95,[204],[96]));
  const [[ax,az],[bx,bz]]=reserveRoad;
  assert(ax!==bx&&az!==bz);
  assert(reserveRoadDistance((ax+bx)/2,(az+bz)/2)<.000001);
});

test('Davi has a clear exit north of the house and Ocean Drive has no pole on its east lane',()=>{
  const prior=globalThis.document,noop=()=>{};
  globalThis.document={createElement:()=>({getContext:()=>({fillRect:noop,strokeRect:noop,fillText:noop,createRadialGradient:()=>({addColorStop:noop})})})};
  try{
    const world=createWorld(new Scene(),false),x=home.entryX-1.42;
    for(let offset=0;offset<=4;offset+=.25)assert(!world.collides(x,home.z+.35-offset,.31));
    for(let z=-272;z<=340;z+=.5)assert(!world.collidesVehicle(210.1,z,0),`solid east lane: ${z}`);
  } finally {if(prior)globalThis.document=prior;else delete globalThis.document;}
});


test('city GPS routes around reclaimed street spans without using them as shortcuts',()=>{
  const from={x:XS[1],z:ZS[6]},to={x:XS[1],z:ZS[7]},route=makeUrbanRouter(XS,ZS)(from,to);
  assert.equal(openSpan('x',1,6),false);
  assert(route.some(p=>p.x!==from.x));
  for(let i=2;i<route.length-2;i++){
    const a=route[i],b=route[i+1];
    if(a.x!==b.x)assert(openSpan('z',XS.indexOf(Math.min(a.x,b.x)),ZS.indexOf(a.z)));
    else if(a.z!==b.z)assert(openSpan('x',XS.indexOf(a.x),ZS.indexOf(Math.min(a.z,b.z))));
  }
});
