import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [url='http://localhost:4173/jogar.html',out='.playtest/cutscenes-3d']=process.argv.slice(2);
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...(executablePath?['--single-process','--no-zygote']:[])]});
try {
  const page=await browser.newPage({viewport:{width:560,height:390},deviceScaleFactor:.65});page.setDefaultTimeout(65000);
  const errors=[],voices=new Set();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|Shader Error|THREE/.test(m.text()))errors.push(m.text());});
  page.on('response',r=>{if(r.ok()&&/\/voices\/(quiosque|cena)-/.test(r.url()))voices.add(r.url().split('/').at(-1));});
  await page.addInitScript(()=>{
    localStorage.setItem('mare-settings',JSON.stringify({quality:'low'}));
    localStorage.setItem('mare-campaign-v6',JSON.stringify({stage:0,step:0,casinoSeen:true,getawaySeen:true,introSeen:true}));
    const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(k,opts){return get.call(this,k,k.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
  });
  const canvas=page.locator('#playfield > canvas.world-view');
  async function capture(name){
    const f=await canvas.evaluate(c=>c.toDataURL('image/jpeg',.93));
    await writeFile(join(out,`${name}.jpg`),Buffer.from(f.split(',')[1],'base64'));
  }
  await page.goto(url);await page.getByRole('button',{name:'Continuar história',exact:true}).click();
  await page.locator('#objective[data-distance]').waitFor();await canvas.evaluate(c=>{window.gameCanvas=c;});await page.keyboard.down('Shift');await page.keyboard.down('w');
  const prompt=page.locator('.interact').filter({hasText:'Falar com Davi'});
  try { await prompt.waitFor(); } finally { await page.keyboard.up('w');await page.keyboard.up('Shift'); }
  await page.keyboard.press('e');
  const kiosk=page.locator('#playfield[data-street-scene="kiosk"]');await kiosk.waitFor();
  assert(await page.evaluate(()=>document.querySelector('#playfield > .world-view')===window.gameCanvas));
  assert.equal(await kiosk.locator('[data-film-camera], video, .film-player').count(),0);
  const box=await canvas.boundingBox();await page.mouse.move(box.x+90,box.y+91);await page.mouse.down();await page.mouse.move(box.x+180,box.y+117);await page.mouse.up();
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('d');
  assert.equal(await kiosk.getAttribute('data-camera'),null);
  await page.locator('#playfield[data-street-scene="kiosk"][data-shot="davi"]').waitFor();await capture('01-davi');
  await page.locator('#playfield[data-street-scene="kiosk"][data-shot="chave"]').waitFor();await capture('02-chave');
  await kiosk.waitFor({state:'hidden'});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mare-campaign-v6')).step===1);
  assert(voices.has('quiosque-davi.mp3')&&voices.has('quiosque-luzia.mp3'));
  assert.deepEqual(errors,[]);
  console.log('Quiosque: câmera dirigida no canvas do jogo, vozes e retomada da missão.');
} finally { await browser.close(); }
