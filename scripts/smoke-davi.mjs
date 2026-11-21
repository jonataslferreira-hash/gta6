import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const [url='http://localhost:4173/jogar.html',out='.playtest/davi']=process.argv.slice(2);
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...(executablePath?['--single-process','--no-zygote']:[])]});
try {
  const page=await browser.newPage({viewport:{width:700,height:520}});page.setDefaultTimeout(55000);
  const errors=[],recordings=new Set();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.ok()&&/\/(orla-cafe|orla-vendedor|casino-06|casino-07)\.mp3$/.test(r.url()))recordings.add(r.url());});
  await page.addInitScript(()=>localStorage.setItem('mare-settings','{"quality":"low","devMode":true}'));
  await page.goto(url);await page.locator('#launch').click();await page.locator('#playfield[data-coords]').waitFor();
  const press=k=>page.keyboard.press(k),cover=page.locator('.switch-cover');
  const coord=async()=> (await page.locator('#playfield').getAttribute('data-coords')).split(',').map(Number);
  async function move(key,index,goal,greater=false){
    await page.keyboard.down(key);
    try{await page.waitForFunction(([i,n,g])=>{const current=+document.querySelector('#playfield').dataset.coords?.split(',')[i];return g?current>n:current<n;},[index,goal,greater]);}
    finally{await page.keyboard.up(key);}
  }
  await press('v');await page.locator('#mission-name').filter({hasText:'Davi / Linha independente'}).waitFor();await cover.waitFor({state:'hidden'});
  await page.waitForFunction(()=>+document.querySelector('#playfield').dataset.coords?.split(',')[1]>150);
  const initial=await coord();assert(initial[0]<219,'Davi starts outside the house');
  await move('w',1,initial[1]-3);assert((await coord())[1]<initial[1]-3);console.log('Davi apareceu na calçada e andou.');
  await press('m');await page.locator('.map-panel').waitFor();const mapFrame=await page.locator('#bigmap').evaluate(c=>c.toDataURL('image/jpeg',.94));await writeFile(join(out,'01-mapa.jpg'),Buffer.from(mapFrame.split(',')[1],'base64'));await page.locator('#close-map').click();
  await press('v');await page.locator('#mission-name').filter({hasText:'Explore Vice City'}).waitFor();await cover.waitFor({state:'hidden'});
  await move('w',1,55.2);await move('d',0,212.2,true);
  const chat=page.locator('.interact').filter({hasText:'Conversar'}),caption=page.locator('.ride-caption:not([hidden]) p');
  await chat.waitFor();await press('e');await caption.waitFor();const line=await caption.textContent();
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>/\/(orla-cafe|orla-vendedor|casino-06|casino-07)\.mp3$/.test(r.name)));
  await press('e');await page.waitForFunction(previous=>document.querySelector('.ride-caption p').textContent!==previous,line);
  await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(r=>/\/(orla-cafe|orla-vendedor|casino-06|casino-07)\.mp3$/.test(r.name)).length>=2);
  assert(recordings.size>=2);assert.deepEqual(errors,[]);
  console.log('Davi anda fora da casa, a troca volta para Luzia e pedestres alternam gravações.');
} finally {await browser.close();}
