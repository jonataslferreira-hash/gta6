import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { campaign } from '../src/missions.js';

const entry = new URL(process.argv[2] ?? 'http://localhost:4173/jogar.html').href;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader', ...(executablePath ? ['--no-zygote','--single-process'] : [])] });
const desktop = await browser.newPage({ viewport: { width: 640, height: 440 } });
const errors = [];
const delivered = new Set();
desktop.on('pageerror', error => errors.push(error.message));
desktop.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
desktop.on('response', response => { if (response.ok() || response.status() === 206) delivered.add(new URL(response.url()).pathname); });

try {
  await desktop.addInitScript(() => localStorage.setItem('mare-settings', '{"quality":"low","volume":55}'));
  await desktop.goto(entry);
  const voice = desktop.waitForResponse(r => r.url().endsWith('/voices/line-01.mp3'));
  await desktop.getByRole('button', {name:'Iniciar história',exact:true}).click();
  assert((await voice).ok());
  await desktop.locator('#speaker').waitFor();
  assert.equal(await desktop.locator('#speaker').textContent(), 'Luzia');
  assert([...delivered].some(path => path.endsWith('/models/luzia.glb')));
  for (let i=0; i<4; i++) await desktop.locator('#advance').click();
  assert(await desktop.locator('.touch').isHidden());
  await desktop.keyboard.press('j');
  await desktop.locator('#jobs-panel').waitFor();
  assert.equal(await desktop.locator('#jobs-list article').count(), 6);
  await desktop.locator('[data-track="arcade"]').click();
  await desktop.getByText('✦ Fliperama do Píer', {exact:true}).click();
  await desktop.getByRole('heading', {name:'Memória neon'}).waitFor();
  await desktop.getByText('Sua vez.').waitFor();
  for (const key of [0,2,1,3,2]) await desktop.locator(`[data-puzzle="${key}"]`).click();
  let state = await desktop.evaluate(() => JSON.parse(localStorage.getItem('mare-campaign-v2')));
  assert.equal(state.side.arcade, 1);
  assert.equal(state.stage, 0);
  await desktop.locator('#hud-radio').click();
  await desktop.locator('[data-radio="1"]').click();
  await desktop.getByText(/Mortimer.s Chipdisko/).waitFor();
  await desktop.locator('#skip-radio').click();
  await desktop.getByText(/Midday — SnugglyBun/).waitFor();
  await desktop.locator('#close-radio').click();
  assert([...delivered].some(path => path.includes('/radio/')));
  console.log('Abertura, guia, fliperama, rádio, voz e modelo carregados.');

  // Resume a legitimate checkpoint to cover campaign puzzle without repeating the drive.
  await desktop.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mare-campaign-v2'));
    localStorage.setItem('mare-campaign-v2', JSON.stringify({...saved, stage:1, step:1}));
  });
  await desktop.reload();
  await desktop.getByRole('button', {name:'Continuar história',exact:true}).click();
  await desktop.getByText('Comparar os negativos', {exact:true}).click();
  await desktop.locator('[data-puzzle="0"]').click();
  await desktop.getByText(/Não foi essa/).waitFor();
  await desktop.locator(`[data-puzzle="${campaign[1].steps[1].puzzle.order[0]}"]`).click();
  await desktop.locator('#mission-name').filter({hasText:'O lado de fora'}).waitFor();
  state = await desktop.evaluate(() => JSON.parse(localStorage.getItem('mare-campaign-v2')));
  assert.equal(state.stage, 2);
  assert.equal(state.side.arcade, 1);
  assert.deepEqual(errors, []);
  console.log('Puzzle da campanha avançou a missão e preservou o progresso opcional.');

  const mobile = await browser.newPage({ viewport:{width:390,height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
  await mobile.goto(entry);
  await mobile.locator('#secondary').tap();
  await mobile.locator('#stick').waitFor();
  await mobile.locator('#hud-jobs').tap();
  await mobile.locator('#jobs-panel').waitFor();
  console.log('Joystick e guia acessíveis por toque.');
} finally {
  await browser.close();
}
