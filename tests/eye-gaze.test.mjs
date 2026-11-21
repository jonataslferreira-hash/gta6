import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector2 } from 'three';
import { eyeAtlasBasis,followEyeGaze } from '../src/eye-gaze.js';

test('eyes ease into a shared glance, keep it inside the lids and return to neutral',()=>{
  const gaze=new Vector2();
  followEyeGaze(gaze,.016,{eye:3,look:-1,pitch:.5});
  assert(gaze.x>0&&gaze.x<.3);
  assert(gaze.y>0&&gaze.y<.3);
  followEyeGaze(gaze,1,{eye:3,eyePitch:-3},1);
  assert(gaze.x>.99&&gaze.x<=1);
  assert(gaze.y<-.99&&gaze.y>=-1);
  followEyeGaze(gaze,1,null);
  assert(gaze.length()<.001);
});

test('horizontal and vertical gaze axes compensate for the diagonal eye atlas',()=>{
  const h=new Vector2(...eyeAtlasBasis.horizontal),v=new Vector2(...eyeAtlasBasis.vertical);
  assert(Math.abs(h.dot(v))<.001);
  assert(Math.abs(h.length()-1)<.01&&Math.abs(v.length()-1)<.01);
});
