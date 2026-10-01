import { DEFAULT_CATEGORY_RULES } from './categories';
import { seedClients, seedCollected, seedDeclarationLines } from './seed/excelData';
import { runResult } from './useRunResult';
import type { AllocationRun } from './types';

/** Sesiunile aprobate ale unui an, în ordinea lunilor. */
export const finalizedSessions = (runs: AllocationRun[], an: number) =>
  runs.filter((r) => r.anObligatie === an && r.status === 'finalizata').sort((a, b) => a.luna - b.luna);

/** Următoarea lună de alocat (strict în ordine): luna de după ultima sesiune aprobată, sau ianuarie. */
export function nextDueMonth(runs: AllocationRun[], an: number): number {
  const done = finalizedSessions(runs, an);
  return done.length ? done[done.length - 1].luna + 1 : 1;
}

/** Contextul unei sesiuni noi: lunile deja raportate și ajustările aprobate anterior în același an. */
export function sessionContext(runs: AllocationRun[], an: number, luna: number): AllocationRun['context'] {
  const prev = finalizedSessions(runs, an).filter((r) => r.luna < luna);
  return {
    raportatAnterior: prev.flatMap((r) => r.raportLuna ?? []),
    ajustariAnterioare: prev.flatMap((r) => r.ajustari ?? []),
  };
}

export const iso = (an: number, luna: number, zi: number, ora: string) => `${an}-${String(luna).padStart(2, '0')}-${String(zi).padStart(2, '0')}T${ora}:00`;

/** Seed: sesiunile lunare aprobate ianuarie–august 2026 (cele mai noi primele). */
export function buildSeedRuns(): AllocationRun[] {
  // Sesiunile lunare ianuarie–august 2026, aprobate: fiecare lună M a fost alocată la începutul lunii M+1 de Andrei C
  // și aprobată de Ion Popescu. Snapshot-ul fiecărei sesiuni conține doar declarațiile și colectatul existente atunci
  // (luni ≤ M). Cantitățile colectate sunt cele din fișierul Excel (iulie, august).
  const runs: AllocationRun[] = [];
  for (let luna = 1; luna <= 8; luna++) {
    const run: AllocationRun = {
      id: `cmseed2026luna${String(luna).padStart(2, '0')}`,
      anObligatie: 2026,
      luna,
      deLa: { an: 2026, luna: 1 },
      panaLa: { an: 2026, luna },
      baza: 'declaratii_an_curent',
      rataEfectiva: '0.2167',
      pragMinimImplicit: '0.3',
      observatii: '',
      status: 'finalizata',
      reguli: DEFAULT_CATEGORY_RULES,
      snapshot: {
        clienti: seedClients,
        declaratii: seedDeclarationLines.filter((l) => l.an === 2026 && l.luna <= luna),
        colectari: seedCollected.filter((c) => c.an === 2026 && c.luna <= luna),
      },
      context: sessionContext(runs, 2026, luna),
      creatDe: 'adm_andrei',
      creatLa: iso(2026, luna + 1, 3, '09:15'),
      trimisSpreAprobareLa: iso(2026, luna + 1, 3, '11:40'),
      aprobatDe: 'adm_ion',
      finalizatLa: iso(2026, luna + 1, 4, '10:05'),
    };
    run.raportLuna = runResult(run).raportLuna;
    runs.push(run);
  }
  return runs.reverse();
}
