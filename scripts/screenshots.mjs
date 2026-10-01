// Capturi de ecran ale prototipului (necesită `npm run dev` pornit). Rulare: node scripts/screenshots.mjs [baseUrl]
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
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png`, ...opts });
  console.log('✓', name);
};

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.goto(`${base}/admin/alocari`);
await shot('05_rulare_noua');
await page.mouse.wheel(0, 380);
await shot('04_reguli_istoric');

// calculează o rulare ca în captura dev (Ianuarie–Septembrie 2026)
await page.getByRole('button', { name: 'Calculează (draft)' }).click();
await page.waitForURL(/alocari\/c/);
await shot('03_header_avertizari');
await page.getByRole('tab', { name: 'Rezultat pe categorii' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 900);
await shot('02_rezultat_categorii');
await page.getByRole('tab', { name: 'Rezultat pe clienți' }).click();
await page.getByRole('tab', { name: 'Rezultat pe clienți' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 300);
await shot('01_rezultat_clienti');
await shot('01b_rezultat_clienti_full', { fullPage: true });

// flux de aprobare: trimite, comută pe Ion Popescu, aprobă
await page.mouse.wheel(0, -5000);
await page.getByRole('button', { name: 'Trimite spre aprobare' }).click();
await shot('07_in_aprobare_acelasi_admin');
await page.getByLabel('Perspectivă').selectOption('admin:adm_ion');
await page.waitForTimeout(200);
await shot('08_in_aprobare_alt_admin');
await page.getByRole('button', { name: /Aprobă și înlocuiește/ }).click();
await shot('09_finalizata');

// vizibilitate + perspectivă client
await page.goto(`${base}/admin/alocari`);
await page.getByRole('button', { name: 'Publică pentru clienți' }).click();
await page.mouse.wheel(0, 1200);
await shot('10_istoric_dupa_aprobare');
await page.getByLabel('Perspectivă').selectOption('client:cl_933930');
await page.waitForURL(/client\/alocari/);
await shot('11_client_beko', { fullPage: true });
await page.getByText('Echipamente de mari dimensiuni').first().click();
await shot('12_client_beko_extins', { fullPage: true });

await page.getByLabel('Perspectivă').selectOption('admin:adm_andrei');
await page.goto(`${base}/admin/cantitati-colectate`);
await shot('13_cantitati_colectate');
await browser.close();
