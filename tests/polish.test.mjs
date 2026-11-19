import {test} from 'node:test';
import assert from 'node:assert/strict';
import {person} from '../src/actors.js';
import {hudDirection,shortDistance,speedometer} from '../src/hud.js';

test('portrait poses stay finite for silent, stunned and speaking actors',()=>{
  const guard=person({portrait:'davi'});
  for(const acting of [{mood:'shock'},{mood:'anger'},{speaking:true,voice:.7},{seated:true,driver:true,look:.9,lean:.08,beat:2},undefined]){
    for(let n=0;n<6;n++)guard.animate(.016,.4,0,acting);
    guard.root.updateMatrixWorld(true);
    guard.root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));
  }
});
test('HUD headings stay relative to the camera and distances remain legible',()=>{
  assert.equal(hudDirection(0,{x:0,z:0},{x:5,z:0}).degrees,90);
  assert.equal(hudDirection(-Math.PI/2,{x:0,z:0},{x:5,z:0}).degrees,-0);
  assert.equal(shortDistance(1276),'1,3 km');
  assert.deepEqual(speedometer(-5),{text:'018',reverse:true,progress:18/83});
});
