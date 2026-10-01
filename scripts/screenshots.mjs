// Capturi de ecran ale prototipului (necesită `npm run dev` pornit). Rulare: node scripts/screenshots.mjs [baseUrl]
// În mediul cloud: PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/screenshots.mjs
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
  await page.screenshot({ path: `${out}/${name}.png`, ...opts, wait: undefined });
  console.log('✓', name);
};

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.goto(`${base}/admin/alocari`);
await shot('p2_01_alocari_disponibilitate');

// M1 — reguli de alocare
await page.getByRole('tab', { name: 'Reguli de alocare' }).click();
await page.getByLabel('Mută categoria 4B mai sus').click();
await shot('p2_02_reguli_nesalvate', { fullPage: true });
await page.getByRole('button', { name: 'Renunță la modificări' }).click();
await page.getByLabel('Prag minim implicit').fill('30');
await page.getByRole('tab', { name: 'Alocări' }).click();

// M3 — alocare nouă
await page.getByRole('button', { name: 'Alocare nouă' }).click();
await page.waitForTimeout(300);
await page.getByText('Reguli active').scrollIntoViewIfNeeded();
await shot('p2_03_panou_alocare_noua');
await page.getByRole('button', { name: 'Pornește alocarea' }).click();

// M4 — animație: capturi intermediare
await page.waitForTimeout(1800);
await shot('p2_04_live_iulie', { wait: 0 });
await page.getByRole('button', { name: 'Pauză' }).click();
await page.getByText('Rezultat pe clienți').scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 200);
await shot('p2_05_live_pauza_tabel');
await page.getByRole('button', { name: 'Continuă' }).click();
await page.getByRole('button', { name: 'Sari la final' }).click();
await shot('p2_06_final_tabel');
await page.getByRole('switch').click();
await shot('p2_07_final_grupat');
await page.mouse.wheel(0, 2400);
await shot('p2_08_avertizari_finalizare');
await page.mouse.wheel(0, -10000);
await shot('p2_09_kpi_dupa_alocare');
await browser.close();
