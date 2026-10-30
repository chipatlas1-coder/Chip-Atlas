import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [base, out] = process.argv.slice(2);
const pages = ['/', '/tools/insert-code-decoder/', '/tools/theoretical-roughness/', '/tools/turning-calculator/', '/tr/metroloji/'];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
for (const p of pages) {
  await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1200);
  const name = (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_')) + '-m';
  // Two viewport shots: top, and one screen down.
  await page.screenshot({ path: `${out}/${name}-1.png` });
  await page.evaluate(() => window.scrollTo(0, 844));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-2.png` });
  console.log('shot', name);
}
await browser.close();
