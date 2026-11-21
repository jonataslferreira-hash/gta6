import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { intro,campaign,getawayLines } from '../src/missions.js';
import { voiceLines } from '../src/voice-lines.js';

test('all cinematic beats have a distinct recording and a directed expression',()=>{
  const lines=[...intro,...campaign.flatMap(m=>m.steps.flatMap(s=>s.lines||[]))];
  assert.equal(lines.length,23);
  const unique=new Set();
  for(const [actor,line,mood] of lines){
    assert(['Luzia','Davi','Nara','Avelar'].includes(actor));
    assert(['wry','tense','fear','anger','shock','cold'].includes(mood));
    const file=voiceLines[line];
    assert(file&&existsSync(new URL(`../public/voices/${file}`,import.meta.url)),line);
    assert(!unique.has(file));unique.add(file);
  }
});

test('the crime campaign still alternates actions and staged scenes',()=>{
  assert.deepEqual(campaign.flatMap(m=>m.steps).map(s=>s.kind),['talk','drive','park','talk','talk','puzzle','use','puzzle','talk','use','puzzle','talk']);
  assert.equal(getawayLines.length,3);
  for(const [,line] of getawayLines)assert(existsSync(new URL(`../public/voices/${voiceLines[line]}`,import.meta.url)));
  assert.equal(campaign.at(-1).steps.at(-1).lines[0][0],'Avelar');
});
