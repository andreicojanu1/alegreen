import Decimal from 'decimal.js';
import type { AllocationRun, DeclarationLine } from '../../data/types';
import { monthKey } from '../../engine/months';

/** Categoriile din rapoartele lunare (formularul AFM), în ordinea lor oficială, cu denumirile din formular. */
export const REPORT_CATEGORIES: { cod: string; denumire: string }[] = [
  { cod: '1', denumire: 'Echipamente de transfer termic cu agent de transfer termic, mai puțin apa' },
  { cod: '2', denumire: 'Ecrane, monitoare și echipamente care conțin ecrane cu supr. >100 cm2' },
  { cod: '3', denumire: 'Lămpi, neoane, LED, alte tipuri de lămpi' },
  { cod: '4', denumire: 'Echipamente de mari dimensiuni >50 cm' },
  { cod: '4B', denumire: 'Panouri fotovoltaice' },
  { cod: '5', denumire: 'Echipamente de mici dimensiuni <50 cm' },
  { cod: '6', denumire: 'Echipamente informatice și de telecomunicații <50 cm' },
];

const ZERO = new Decimal(0);

/** Datele unui client pentru luna sesiunii, din valorile ÎNGHEȚATE la aprobare (raportLuna) și din declarații. */
export function clientMonthData(run: AllocationRun, clientId: string) {
  const luna = monthKey({ an: run.anObligatie, luna: run.luna });
  const decl = run.snapshot.declaratii.filter((l) => l.clientId === clientId && l.an === run.anObligatie && l.status === 'Aprobată');
  const puseLuna = (cod: string) => sumKg(decl.filter((l) => l.luna === run.luna && l.categorie === cod));
  const puseCumul = (cod: string) => sumKg(decl.filter((l) => l.luna <= run.luna && l.categorie === cod));
  const entries = [...run.context.raportatAnterior, ...(run.raportLuna ?? [])].filter((e) => e.clientId === clientId);
  const colectatLuna = (cod: string) => entries.filter((e) => e.categorie === cod && e.luna === luna).reduce((a, e) => a.plus(e.kg), ZERO);
  const colectatCumul = (cod: string) => entries.filter((e) => e.categorie === cod && e.luna <= luna).reduce((a, e) => a.plus(e.kg), ZERO);
  return { luna, decl, liniiLuna: decl.filter((l) => l.luna === run.luna), puseLuna, puseCumul, colectatLuna, colectatCumul };
}

export function sumKg(lines: DeclarationLine[]): Decimal {
  return lines.reduce((a, l) => a.plus(l.greutateKg), ZERO);
}

/** „08.2026" */
export const lunaRaport = (run: Pick<AllocationRun, 'luna' | 'anObligatie'>) => `${String(run.luna).padStart(2, '0')}.${run.anObligatie}`;
