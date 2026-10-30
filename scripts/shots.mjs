// Render pages with headless Chromium for visual review. Usage: node scripts/shots.mjs <baseURL> <outDir> [mobile]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [base, out, mobile] = process.argv.slice(2);
const pages = ['/', '/tools/', '/tools/insert-code-decoder/', '/tools/theoretical-roughness/', '/tools/turning-calculator/', '/metrology/', '/tr/', '/tr/araclar/uc-kodu-cozucu/'];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 860 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
for (const p of pages) {
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const name = (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_')) + (mobile ? '-m' : '');
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log('shot', name);
}
console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
await browser.close();
