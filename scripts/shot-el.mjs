import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [base, out, path, selector, name] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 });
await page.goto(base + path, { waitUntil: 'load' });
await page.waitForTimeout(800);
const el = await page.$(selector);
await el.screenshot({ path: `${out}/${name}.png` });
await browser.close();
