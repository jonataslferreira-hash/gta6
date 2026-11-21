import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [url='http://localhost:4173/jogar.html',out='.playtest/cafe-sereia']=process.argv.slice(2);
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...(executablePath?['--single-process','--no-zygote']:[])]});
try {
  const page=await browser.newPage({viewport:{width:480,height:340},deviceScaleFactor:.65});page.setDefaultTimeout(65000);
  const errors=[],voices=new Set();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|Shader Error|THREE/.test(m.text()))errors.push(m.text());});
  page.on('response',r=>{if(r.ok()&&/\/voices\/(quiosque|cena)-/.test(r.url()))voices.add(r.url().split('/').at(-1));});
  await page.addInitScript(()=>{
    localStorage.setItem('mare-settings',JSON.stringify({quality:'low'}));
    localStorage.setItem('mare-campaign-v6',JSON.stringify({stage:1,step:1,casinoSeen:true,getawaySeen:true,introSeen:true}));
    const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(k,opts){return get.call(this,k,k.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
  });
  const canvas=page.locator('#playfield > canvas.world-view');
  async function capture(name){
    const f=await canvas.evaluate(c=>c.toDataURL('image/jpeg',.93));
    await writeFile(join(out,`${name}.jpg`),Buffer.from(f.split(',')[1],'base64'));
  }
  await page.goto(url);await page.getByRole('button',{name:'Continuar história',exact:true}).click();
  await canvas.waitFor();await canvas.evaluate(c=>{window.gameCanvas=c;});
  await page.keyboard.press('j');
  await page.getByRole('button',{name:/Marcar Café Sereia/}).click();
  assert.equal(await page.locator('#playfield[data-street-scene]').count(),0,'GPS click must not play the cutscene');
  await page.keyboard.down('a');await page.waitForTimeout(1250);await page.keyboard.up('a');
  await page.keyboard.down('s');
  const prompt=page.locator('.interact').filter({hasText:'Falar com Nara · Depois do expediente'});
  try { await prompt.waitFor({timeout:25000}); } finally { await page.keyboard.up('s'); }
  await page.keyboard.press('e');
  const bonus=page.locator('#playfield[data-street-scene="afterHours"]');await bonus.waitFor();
  assert(await page.evaluate(()=>document.querySelector('#playfield > .world-view')===window.gameCanvas));
  await page.keyboard.press('ArrowRight');await page.keyboard.press('c');
  assert.equal(await bonus.getAttribute('data-camera'),null);
  await page.locator('#playfield[data-street-scene="afterHours"][data-shot="nara"]').waitFor();await capture('01-nara');
  await page.locator('#playfield[data-street-scene="afterHours"][data-shot="reacao"]').waitFor();await capture('02-reacao');
  await bonus.waitFor({state:'hidden'});await prompt.waitFor();
  assert.deepEqual(await page.evaluate(()=>{const {stage,step}=JSON.parse(localStorage.getItem('mare-campaign-v6'));return {stage,step};}),{stage:1,step:1});
  assert.deepEqual([...voices].sort(),['cena-luzia-fico.mp3','cena-nara-fica.mp3']);
  await page.keyboard.press('e');await bonus.waitFor();await page.getByRole('button',{name:'Pular cena'}).click();await bonus.waitFor({state:'hidden'});await prompt.waitFor();
  assert.deepEqual(errors,[]);
  console.log('Café Sereia: GPS, interação local, câmera dirigida, falas e retorno ao jogo, também ao pular.');
} finally { await browser.close(); }
