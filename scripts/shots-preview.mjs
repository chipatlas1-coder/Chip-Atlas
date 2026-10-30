import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [base, out] = process.argv.slice(2);
const pages = ['/index.html', '/tools.html', '/tools/insert-code-decoder.html', '/tools/theoretical-roughness.html', '/tools/turning-calculator.html', '/metrology.html', '/tr.html', '/tr/araclar/uc-kodu-cozucu.html', '/tr/araclar/teorik-puruzluluk.html', '/tr/araclar/tornalama-hesaplayicisi.html', '/tr/araclar.html'];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 860 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
for (const p of pages) {
  await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(700);
  const name = p.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '_') + '-p';
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}
console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
await browser.close();
