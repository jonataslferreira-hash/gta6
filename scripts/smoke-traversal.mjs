import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const [url='http://localhost:4173/jogar.html',dir='.playtest/praia']=process.argv.slice(2);
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser=await chromium.launch({executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...(executablePath?['--no-zygote','--single-process']:[])]});
try{
 const page=await browser.newPage({viewport:{width:640,height:440},reducedMotion:'reduce'});page.setDefaultTimeout(40000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await page.addInitScript(()=>{
   localStorage.setItem('mare-settings','{"quality":"low","volume":55}');
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(name,opts){return get.call(this,name,name.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
   window.playtestAudio=[];
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){if(!window.playtestAudio.includes(this))window.playtestAudio.push(this);return play.call(this);};
 });
 await mkdir(dir,{recursive:true});
 const shot=async n=>{const data=await page.locator('canvas.world-view').evaluate(el=>el.toDataURL('image/jpeg',.90));await writeFile(join(dir,`${n}.jpg`),Buffer.from(data.split(',')[1],'base64'));};
 await page.goto(url);await page.locator('#options').click();await page.locator('[data-settings-tab="input"]').click();
 await page.locator('#full-motion').check();await page.locator('#dev-mode').check();await page.locator('#done').click();
 await page.locator('#launch').click();await page.locator('#playfield[data-coords]').waitFor();
 const press=(key)=>page.keyboard.press(key);
 const move=async (key,coordinate,op,reference)=>{await page.keyboard.down(key);try{await page.waitForFunction(([i,op,goal])=>{const coord=document.querySelector('#playfield')?.dataset.coords?.split(',').map(Number)?.[i];return op==='<'?coord<goal:coord>goal;},[coordinate,op,reference],{timeout:40000});}finally{await page.keyboard.up(key);}console.log('posição',await page.locator('#playfield').getAttribute('data-coords'));};
 await press('p');await page.locator('.pause-shell').waitFor();assert.equal(await page.locator('#resume').evaluate(e=>getComputedStyle(e).animationName),'pause-slide');await page.locator('#resume').click();
 await press('v');await page.locator('.switch-cover').waitFor();await page.locator('#mission-name').filter({hasText:'Davi / Linha independente'}).waitFor();await page.locator('.switch-cover').waitFor({state:'hidden'});await press('v');await page.locator('.switch-cover').waitFor({state:'hidden'});console.log('Modo dev, pausa com animação forçada e troca V.');
 await press('Space');await page.locator('.in-air').waitFor();await shot('01-salto');await page.locator('.in-air').waitFor({state:'hidden'});
 await move('d',0,'>',224.45);await press('Space');await page.locator('#playfield[data-movement="vault"]').waitFor();await shot('02-grade');await page.waitForFunction(()=>+document.querySelector('#playfield').dataset.coords.split(',')[0]>225.62);
 await move('d',0,'>',258);await page.locator('#playfield.swimming').waitFor();await shot('03-nado');await move('a',0,'<',254.66);await page.locator('#playfield.swimming').waitFor({state:'hidden'});console.log('Salto, transposição e entrada/saída do mar.');
 await move('w',1,'<',68);await page.getByText('Pilotar jet ski',{exact:true}).waitFor();await press('e');await page.locator('#playfield[data-movement="jet"]').waitFor();await move('w',0,'>',263);await page.keyboard.down('w');try{await move('d',1,'>',67);}finally{await page.keyboard.up('w');}await shot('04-jet-ski');
 await press('q');await page.getByRole('dialog',{name:'Roda de estações'}).waitFor();await page.getByRole('button',{name:'Rádio Brasil',exact:true}).click();
 await page.waitForFunction(()=>window.playtestAudio.some(e=>/chiquinha-(agua|gaucho)\.mp3/.test(e.currentSrc)&&!e.paused&&e.readyState>=3));
 assert.deepEqual(errors,[]);console.log('Jet ski e Rádio Brasil tocando.');
}finally{await browser.close();}
