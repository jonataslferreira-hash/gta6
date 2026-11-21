import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import * as T from 'three';
import { afterHoursLines,createScreening,screeningDuration,shotFor,streetScenes } from '../src/screening-scenes.js';
import { voiceLines } from '../src/voice-lines.js';

const stub=()=>({root:new T.Group(),animate(){}});
const cast={Luzia:stub,Davi:stub,Nara:stub};
test('Quiosque stages the actors and directed camera in the existing world',()=>{
  const world=new T.Scene(),set=createScreening('kiosk',cast,{},world),site=streetScenes.kiosk;
  try {
    assert.equal(set.stage.parent,world);
    assert.deepEqual(set.stage.position.toArray(),[site.x,site.y,site.z]);
    assert.equal(set.frame(0,16/9),'geral');
    const wide=set.camera.position.clone();
    assert(wide.distanceTo(set.stage.position)<8);
    assert.equal(set.frame(5,16/9),'davi');
    assert(set.camera.position.distanceTo(wide)>2);
    assert.equal(set.frame(9,16/9),'chave');
    set.act(9,.016,'Davi',.3);
    assert(set.act(screeningDuration.kiosk-.01,.016,'',0)>.98);
  } finally {set.dispose();}
  assert.equal(world.children.length,0);
});
test('After Hours uses directed reaction and ending shots at the café',()=>{
  const world=new T.Scene(),set=createScreening('afterHours',cast,{},world);
  try {
    assert.equal(shotFor('afterHours',14.3)[1],'beijo');
    assert.equal(set.frame(15.6,16/9),'reacao');
    assert(set.camera.position.distanceTo(set.stage.position)<3);
    assert.equal(shotFor('afterHours',17.1)[1],'desfecho');
    assert.equal(set.act(17.5,.016,'',0),0);
    assert.equal(set.act(screeningDuration.afterHours-.01,.016,'',0),1);
    assert.equal(afterHoursLines.length,2);
    for(const [,line] of afterHoursLines){assert(voiceLines[line]);assert(existsSync(new URL(`../public/voices/${voiceLines[line]}`,import.meta.url)));}
  } finally {set.dispose();}
});
