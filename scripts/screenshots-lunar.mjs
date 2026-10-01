// Fluxul lunar: colectat septembrie → sesiune septembrie → revizuire → aprobare → rapoartele clientului.
// PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/screenshots-lunar.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = 'screenshots-out';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1905, height: 985 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && console.error('CONSOLE', m.text()));
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(opts.wait ?? 400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: !!opts.fullPage });
  console.log('✓', name);
};

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.goto(`${base}/admin/alocari`);
await page.mouse.wheel(0, 3000);
await shot('p5_01_istoric_sesiuni_lunare');

// colectat în septembrie (grila Cantități colectate)
await page.goto(`${base}/admin/cantitati-colectate`);
const cell = (row, col) => page.locator('tbody tr').nth(row).locator('td').nth(col).locator('input');
await cell(1, 9).fill('25'); // cat. 2, septembrie
await cell(1, 9).press('Tab');
await cell(6, 9).fill('400000'); // cat. 4B, septembrie
await cell(6, 9).press('Tab');
await cell(3, 9).fill('150000'); // cat. 4, septembrie
await cell(3, 9).press('Tab');
await shot('p5_02_colectat_septembrie');

await page.goto(`${base}/admin/alocari`);
await page.getByRole('button', { name: 'Alocare nouă' }).click();
await page.getByRole('button', { name: /Pornește alocarea pentru/ }).scrollIntoViewIfNeeded();
await shot('p5_03_panou_sesiune_septembrie');
await page.getByRole('button', { name: /Pornește alocarea pentru/ }).click();
await page.getByLabel('Viteza animației').selectOption('0.5');
await page.getByRole('tab', { name: 'Rezultat pe clienți' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 200);
await shot('p5_04_live_septembrie', { wait: 1200 });
await page.getByRole('button', { name: 'Sari la final' }).click();
await page.getByRole('link', { name: /Revizuiește și confirmă/ }).first().click();
await page.waitForURL(/revizuire/);
await page.getByRole('heading', { name: 'Alocarea pe clienți' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 1500);
await shot('p5_05_revizuire_septembrie');
await page.mouse.wheel(0, 5000);
await page.getByRole('button', { name: 'Confirmă și trimite spre aprobare' }).click();
await page.waitForURL(/alocari\/[^/]+$/);
await page.getByLabel('Perspectivă').selectOption('admin:adm_ion');
await page.getByRole('button', { name: /Aprobă și publică/ }).click();
await page.getByRole('alertdialog').getByRole('button', { name: 'Aprobă' }).click();
await page.goto(`${base}/admin/alocari`);
await page.getByRole('button', { name: 'Publică pentru clienți' }).click();
await page.getByLabel('Perspectivă').selectOption('client:cl_45718753');
await page.waitForURL(/client\/alocari/);
await shot('p5_06_client_rapoarte_lunare');
await page.getByRole('link', { name: 'Situație EEE' }).first().click();
await shot('p5_07_situatie_eee_septembrie', { fullPage: true });
await page.getByRole('link', { name: 'Raport AFM' }).click();
await shot('p5_08_raport_afm_septembrie', { fullPage: true });
await page.goto(`${base}/client/alocari`).catch(() => {});
await page.getByLabel('Perspectivă').selectOption('client:cl_17412685');
await page.waitForTimeout(300);
await page.locator('tr', { hasText: 'Iulie 2026' }).getByRole('link', { name: 'Raportare EEE' }).click();
await shot('p5_09_raportare_eee_iulie_elbi', { fullPage: true });
await browser.close();
