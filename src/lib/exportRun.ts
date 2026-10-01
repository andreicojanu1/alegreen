import * as XLSX from 'xlsx';
import type Decimal from 'decimal.js';
import type { AllocationResult } from '../engine/types';
import { monthKey } from '../engine/months';
import type { AllocationRun, Client } from '../data/types';
import { LUNI } from './format';
import { baseLabel, periodLabel, rateLabel } from './runLabels';

const n = (d: Decimal) => Number(d.toFixed(6)); // valorile persistate au 6 zecimale (§7)

/** EXP-01: exportul Excel al unei rulări, cu foi separate, comparabil cu fișierul de referință. */
export function exportRunExcel(run: AllocationRun, res: AllocationResult, names: Record<string, string>, clients: Client[]) {
  const wb = XLSX.utils.book_new();
  const months = res.luni.map((m) => ({ key: monthKey(m), label: `${LUNI[m.luna - 1]} ${m.an}` }));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // Antet (EXP-04): criterii, perioadă, totaluri
  const head = [
    ['Alocare DEEE', `Anul de obligație ${run.anObligatie}`],
    ['Perioada de colectare', periodLabel(run)],
    ['Rată efectivă', rateLabel(run.rataEfectiva)],
    ['Bază de calcul', baseLabel(run)],
    ['Status', run.status],
    ['Obligație totală (kg)', n(res.totaluri.obligatie)],
    ['Total alocat (kg)', n(res.totaluri.totalAlocat)],
    ['Îndeplinire globală', n(res.totaluri.procentIndeplinire)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(head), 'Rulare');

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Client', 'CUI', 'Cod categorie', 'Declarat (kg)'],
      ...res.clienti.map((c) => [clientById.get(c.clientId)?.denumire, clientById.get(c.clientId)?.cui, c.categorie, n(c.declarat)]),
    ]),
    'Declarat agregat',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Cod', 'Categorie', ...months.map((m) => `Colectat ${m.label} (kg)`), 'Total (kg)'],
      ...res.categorii.map((c) => [c.cod, names[c.cod], ...months.map((m) => n(c.colectatLuna[m.key])), n(c.colectat)]),
    ]),
    'Colectat',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Cod', 'Categorie', 'Declarat (kg)', 'Obligație (kg)', 'Minim propriu (kg)', ...months.map((m) => `Colectat ${m.label} (kg)`),
        'Colectat total (kg)', 'Utilizat din propriu (kg)', 'Surplus în pool (kg)', 'Necesar rămas (kg)',
        'Maxim admis din alte categorii (kg)', 'Alocat din pool (kg)', 'Pool rămas (kg)', 'Total alocat (kg)', '% din obligație',
        ...months.map((m) => `Alocat ${m.label} (kg)`), 'Regulă aplicată'],
      ...res.categorii.map((c) => [
        c.cod, names[c.cod], n(c.declarat), n(c.obligatie), n(c.minimPropriu), ...months.map((m) => n(c.colectatLuna[m.key])),
        n(c.colectat), n(c.utilizatPropriu), n(c.surplus), n(c.necesarRamas), n(c.plafon), n(c.alocatPool), n(c.poolRamasDupa),
        n(c.totalAlocat), n(c.procentIndeplinire), ...months.map((m) => n(c.alocatLuna[m.key])), c.regulaAplicata,
      ]),
    ]),
    'Rezultat categorii',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Cod', 'Client', 'CUI', 'Declarat (kg)', 'Obligație (kg)', '% din categorie', 'Alocat TOTAL (kg)', '% îndeplinire'],
      ...res.clienti.map((c) => [
        c.categorie, clientById.get(c.clientId)?.denumire, clientById.get(c.clientId)?.cui, n(c.declarat), n(c.obligatie),
        n(c.cotaCategorie), n(c.totalAlocat), n(c.procentIndeplinire),
      ]),
    ]),
    'Rezultat clienți',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Cod', 'Client', ...months.map((m) => `Alocat ${m.label} (kg)`)],
      ...res.clienti.map((c) => [c.categorie, clientById.get(c.clientId)?.denumire, ...months.map((m) => n(c.alocatLuna[m.key]))]),
    ]),
    'Defalcare lunară',
  );

  // EXP-05: alegreen_{tip}_{client-slug}_{an}_{aaaallzz}.{ext}
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(wb, `alegreen_alocare_toti-clientii_${run.anObligatie}_${stamp}.xlsx`);
}
