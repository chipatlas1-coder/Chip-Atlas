import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, deviceScaleFactor: 2 });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const el = await page.$('[data-shaft-stage]');
await el.screenshot({ path: `${out}/hero.png` });
await browser.close();
