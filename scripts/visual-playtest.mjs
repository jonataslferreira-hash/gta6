import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { performance } from 'node:perf_hooks';

const args=process.argv.slice(2), mobile=args.includes('--mobile'), city=args.includes('--city');
const [url='http://localhost:4173/jogar.html',output]=args.filter(arg=>!['--mobile','--city'].includes(arg));
const entry=new URL(url),dir=resolve(output||`.playtest/${mobile?'mobile':'desktop'}${city?'-cidade':''}`);
await mkdir(dir,{recursive:true});
const size=mobile?{width:390,height:780}:{width:800,height:500};
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser=await chromium.launch({executablePath,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  ...(executablePath?['--no-zygote','--single-process']:[]),
]});
const shots=[], errors=[], start=performance.now();
let failure;
try{
  const page=await browser.newPage({viewport:size,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'});
  page.setDefaultTimeout(120000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.addInitScript(()=>{
    localStorage.setItem('mare-settings',JSON.stringify({quality:'low',volume:55}));
    // Keep the actual rendered frame available as a fallback if the compositor capture times out.
    const context=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,options){
      return context.call(this,kind,kind.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);
    };
  });
  await page.goto(entry.href);
  const capture=async name=>{
    // Hold the simulation while Chromium captures the HUD, text and WebGL frame together.
    // This does not alter position, mission state or input; the next RAF resumes the game.
    const state=await page.evaluate(async()=>{
      const canvas=document.querySelector('.world-view'), host=document.querySelector('#playfield');
      const snapshot=canvas?.toDataURL('image/jpeg',.91);
      if(canvas&&snapshot){
        const frame=new Image();frame.setAttribute('aria-hidden','true');frame.src=snapshot;await frame.decode();
        frame.className=canvas.className;frame.style.cssText=canvas.style.cssText;
        frame.style.pointerEvents='none';canvas.after(frame);
        const raf=window.requestAnimationFrame,queued=[];
        window.requestAnimationFrame=callback=>(queued.push(callback),-1);
        window.__resumePlaytest=()=>{window.requestAnimationFrame=raf;for(const fn of queued)raf.call(window,fn);frame.remove();};
      }
      const text=sel=>{const el=document.querySelector(sel);return el&&el.getClientRects().length?el.textContent.trim():null;};
      return {phase:host?.dataset.heist??null,shot:host?.dataset.miragemShot??null,speaker:text('.ride-caption small'),subtitle:text('.ride-caption p'),objective:text('.casino-tip strong'),hint:text('.casino-tip p'),bearing:text('.miragem-direction b'),panel:text('#dialog[open] h2'),locked:document.pointerLockElement===canvas&&!!canvas,snapshot};
    });
    const {snapshot,...visible}=state;
    let file=`${name}.jpg`, mode='tela inteira';
    try{await page.screenshot({path:join(dir,file),type:'jpeg',quality:91,timeout:7000});}
    catch(error){
      if(!snapshot)throw error;
      file=`${name}-cena.jpg`;mode='cena 3D sem HUD';
      await writeFile(join(dir,file),Buffer.from(snapshot.split(',')[1],'base64'));
    }finally{await page.evaluate(()=>{window.__resumePlaytest?.();delete window.__resumePlaytest;});}
    shots.push({file,mode,elapsedMs:Math.round(performance.now()-start),...visible});
    console.log(`${file} · ${mode}${visible.objective?` · ${visible.objective}`:''}`);
  };
  const pick=(name)=>page.getByRole('button',{name,exact:true});
  const click=el=>mobile?el.tap():el.click();
  const phase=name=>page.locator(`#playfield[data-heist=${name}]`);
  await capture('01-menu');
  if(city){
    await click(page.locator('#secondary'));
    await page.locator('#compass').waitFor();
    await capture('02-cidade');
    await click(page.locator('#hud-map'));
    await page.locator('.map-panel').waitFor();
    await capture('03-mapa');
    await click(page.locator('#close-map'));
    await click(page.locator('#hud-pause'));
  }else{
    await click(pick('Iniciar história'));
    await phase('title').waitFor();
    await capture('02-cartela');
    await phase('arrival').waitFor();
    await page.locator('.ride-caption').waitFor();
    await capture('03-chegada-frontal');
    await page.locator('#playfield[data-miragem-shot=handoff]').waitFor();
    await capture('04-camera-em-movimento');
    await phase('stealth').waitFor();
    await page.locator('.miragem-direction').waitFor();
    await capture('05-primeira-rota');
    if(!mobile){
      await page.keyboard.down('d');
      try{await page.waitForFunction(()=>document.querySelector('.casino-tip kbd')?.textContent==='E / INTERAGIR',{},{timeout:22000});}
      finally{await page.keyboard.up('d');}
      await capture('06-no-objetivo');
      await page.keyboard.press('e');
      await page.getByText('Desligue o sensor da vitrine',{exact:true}).waitFor();
      await capture('07-segundo-objetivo');
      await page.keyboard.press('p');
    }else{
      await click(page.locator('#hud-pause'));
    }
  }
  await page.locator('.pause-shell[open]').waitFor();
  await capture('08-pausa-entrada');
  await page.locator('#resume').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});
  await capture('09-pausa-completa');
}catch(error){failure=String(error);throw error;}
finally{
  await browser.close();
  await writeFile(join(dir,'sessao.json'),JSON.stringify({entry:entry.href,size,mobile,city,shots,errors,failure},null,2)+'\n');
}
