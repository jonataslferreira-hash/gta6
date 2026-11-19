import assert from 'node:assert/strict';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const base = new URL(process.argv[2] ?? 'http://localhost:4173/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const retries = Number(process.env.PAGES_SMOKE_ATTEMPTS ?? 1);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const browser = await chromium.launch({ executablePath });
try {
  for (const entry of ['jogar.html', '']) {
    const url = new URL(entry, base);
    for (let attempt = 1; ; attempt++) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('response', response => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      try {
        const response = await page.goto(url.href, { waitUntil: 'load', timeout: 15000 });
        assert(response?.ok(), `Falha ao abrir ${url}: HTTP ${response?.status()}`);
        const html = await response.text();
        assert(html.includes('id="startup"'), `O endereço ainda não serve o HTML desta versão: ${url}`);
        assert(!html.includes('/src/main.js'), `Código-fonte servido no lugar do build: ${url}`);
        await page.getByRole('button', { name: 'Iniciar história', exact: true }).waitFor({ timeout: 5000 });
        assert(await page.locator('#startup').isHidden(), 'A tela de carregamento não foi dispensada');
        const images = await page.locator('.card img').evaluateAll(elements => elements.map(img => img.naturalWidth));
        assert(images.length === 3 && images.every(width => width > 0), `As imagens do menu não carregaram em ${url}`);
        assert.deepEqual(errors, []);
        console.log(`Menu e imagens carregados em ${url}`);
        break;
      } catch (error) {
        console.error(`${url} (tentativa ${attempt}): ${error.message}${errors.length ? `\n${errors.join('\n')}` : ''}`);
        if (attempt >= retries) throw error;
      } finally {
        await page.close();
      }
      await wait(12000);
    }
  }
} finally {
  await browser.close();
}
