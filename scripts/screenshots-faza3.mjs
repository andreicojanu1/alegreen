// Capturi pentru sesiunea de alocare: animație pe categorii, revizuire cu ajustări, aprobare, client.
// PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/screenshots-faza3.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = 'screenshots-out';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1905, height: 985 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
page.on('dialog', (d) => d.accept());
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(opts.wait ?? 400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: !!opts.fullPage });
  console.log('✓', name);
};

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.goto(`${base}/admin/alocari`);
await page.getByRole('button', { name: 'Alocare nouă' }).click();
await page.getByRole('button', { name: 'Pornește alocarea' }).click();
await page.waitForTimeout(600);
await page.getByRole('tab', { name: 'Rezultat pe categorii' }).click();
await page.waitForTimeout(2600);
await page.getByRole('button', { name: 'Pauză' }).click();
await page.getByRole('tab', { name: 'Rezultat pe categorii' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 250);
await shot('p3_01_categorii_live');
await page.getByRole('button', { name: 'Sari la final' }).click();
await page.mouse.wheel(0, -400);
await shot('p3_02_final_cta_revizuire');

// a doua alocare pe același an -> sesiune unică
await page.mouse.wheel(0, -5000);
await page.getByRole('button', { name: 'Alocare nouă' }).click();
await page.getByText('Există deja o sesiune').scrollIntoViewIfNeeded();
await shot('p3_03_sesiune_unica');
await page.getByRole('button', { name: 'Anulează' }).click();

await page.getByRole('link', { name: /Revizuiește și confirmă/ }).first().click();
await page.waitForURL(/revizuire/);
await shot('p3_04_revizuire_initial');
// mutare: ECO SUN 4B -1.000 kg -> ATLANTIS +Max
const eco = page.getByLabel('Alocat final ECO SUN NICULESTI S.R.L. categoria 4B');
await eco.fill('2.322.036,30');
await eco.press('Enter');
await page.getByRole('heading', { name: 'Alocarea pe clienți' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 650);
await shot('p3_05_dupa_retragere');
await page.getByRole('row', { name: /ATLANTIS R.PW/ }).filter({ hasText: '4B' }).getByRole('button', { name: 'Max' }).click().catch(async () => {
  await page.locator('tr', { hasText: 'ATLANTIS R.PW' }).getByRole('button', { name: 'Max' }).last().click();
});
await shot('p3_06_dupa_atribuire');
await page.locator('textarea').fill('Test prototip: mutare 1.000 kg panouri de la ECO SUN la ATLANTIS, la cererea clienților.');
await page.mouse.wheel(0, 5000);
await shot('p3_07_jurnal_confirmare');
await page.getByRole('button', { name: 'Confirmă și trimite spre aprobare' }).click();
await page.waitForURL(/alocari\/[^/]+$/);
await page.getByLabel('Perspectivă').selectOption('admin:adm_ion');
await page.waitForTimeout(300);
await page.getByText('Ajustări manuale la revizuire').scrollIntoViewIfNeeded();
await shot('p3_08_aprobator_vede_ajustari');
await page.getByRole('button', { name: /Aprobă și/ }).click();
await page.getByRole('alertdialog').getByRole('button', { name: 'Aprobă' }).click();
await page.goto(`${base}/admin/alocari`);
await page.getByRole('button', { name: 'Publică pentru clienți' }).click();
await page.getByLabel('Perspectivă').selectOption('client:cl_45718753');
await page.waitForURL(/client\/alocari/);
await shot('p3_09_client_atlantis', { fullPage: true });
await browser.close();
