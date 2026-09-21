// Requires Playwright (`npm i -D playwright`) and the site served at
// http://127.0.0.1:8811 (e.g. `python3 -m http.server 8811`).
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'qa-output');
mkdirSync(OUT, { recursive: true });

const consoleErrors = [];
const pageErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => pageErrors.push(String(err)));

await page.goto('http://127.0.0.1:8811/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200); // let loader + hero entrance finish

await page.screenshot({ path: `${OUT}/01-hero.png` });

const sections = ['manifesto', 'collection', 'campaign', 'film', 'materials', 'studio', 'lookbook', 'journal', 'storefront', 'finalCampaign', 'contact'];
for (const id of sections) {
  await page.evaluate((sel) => document.getElementById(sel)?.scrollIntoView({ behavior: 'instant', block: 'start' }), id);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${OUT}/sec-${id}.png` });
}

// interactions
await page.evaluate(() => document.getElementById('bagToggle').click());
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/cart-empty.png` });
await page.evaluate(() => document.getElementById('cartClose').click());
await page.waitForTimeout(500);

await page.evaluate(() => document.querySelector('[data-open-product]').click());
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/product-overlay.png` });
await page.evaluate(() => document.querySelector('#sizeGrid button').click());
await page.waitForTimeout(200);
await page.evaluate(() => document.getElementById('addBagBtn').click());
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/product-added.png` });
await page.evaluate(() => document.getElementById('productClose').click());
await page.waitForTimeout(500);

await page.evaluate(() => document.getElementById('bagToggle').click());
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/cart-with-item.png` });
await page.evaluate(() => document.getElementById('checkoutBtn').click());
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/checkout-status.png` });
await page.evaluate(() => document.getElementById('cartClose').click());
await page.waitForTimeout(400);

await page.evaluate(() => document.getElementById('lookbookNext').click());
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/lookbook-next.png` });

await page.evaluate(() => document.getElementById('playFilm').click());
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/film-overlay.png` });
await page.evaluate(() => document.getElementById('filmClose').click());
await page.waitForTimeout(300);

// newsletter
await page.evaluate(() => { document.getElementById('newsletterEmail').value = 'press@example.com'; document.getElementById('newsletterForm').requestSubmit(); });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/newsletter.png` });

await browser.close();

console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
console.log('PAGE ERRORS:', JSON.stringify(pageErrors, null, 2));
console.log('Screenshots in', OUT);
