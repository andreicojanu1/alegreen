import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { buildSeedRuns, nextDueMonth } from '../data/sessions';
import { runResult } from '../data/useRunResult';
import { seedClients } from '../data/seed/excelData';
import type { AllocationRun } from '../data/types';

/**
 * Sesiunile lunare: alocarea lunii M = cumulat ian–M − ce s-a raportat deja; lunile aprobate rămân înghețate.
 * Seed-ul conține sesiunile aprobate ianuarie–august 2026 pe datele reale (colectare în iulie și august).
 */
const runs = buildSeedRuns();
const byMonth = (m: number) => runs.find((r) => r.luna === m)!;
const sumMonths = (clientName: string, cat: string, upTo: number) => {
  const id = seedClients.find((c) => c.denumire === clientName)!.id;
  return runs
    .filter((r) => r.luna <= upTo)
    .flatMap((r) => r.raportLuna ?? [])
    .filter((e) => e.clientId === id && e.categorie === cat)
    .reduce((a, e) => a.plus(e.kg), new Decimal(0));
};

describe('sesiuni lunare de alocare', () => {
  it('seed: 8 sesiuni aprobate, următoarea lună de alocat este septembrie', () => {
    expect(runs).toHaveLength(8);
    expect(runs.every((r) => r.status === 'finalizata' && r.raportLuna)).toBe(true);
    expect(nextDueMonth(runs, 2026)).toBe(9);
  });

  it('ianuarie–iunie: fără colectat, alocările lunare sunt 0', () => {
    for (let m = 1; m <= 6; m++) expect(byMonth(m).raportLuna!.every((e) => e.kg === '0.00')).toBe(true);
  });

  it('suma rapoartelor lunare iulie + august = cumulatul golden pe client (§14.4, toleranță 0,01 kg)', () => {
    // toleranța din brief: regula §7 dă reziduul de rotunjire al categoriei clientului cu cota cea mai mare
    // (ex. Elbi, 83% din cat. 5, primește 61.830,32 în loc de 61.830,31)
    const close = (v: Decimal, golden: number) => expect(v.minus(golden).abs().lessThanOrEqualTo(0.01), v.toFixed(2)).toBe(true);
    close(sumMonths('NOVO BRANDS SRL', '2', 8), 188.31);
    close(sumMonths('BEKO ROMANIA S.A.', '4', 8), 333130.57);
    close(sumMonths('Elbi Electric & Lighting SRL', '5', 8), 61830.31);
    close(sumMonths('IHUNT TECHNOLOGY IMPORT-EXPORT S.A', '6', 8), 1807.17);
    close(sumMonths('ECO SUN NICULESTI S.R.L.', '4B', 8), 2323036.3);
  });

  it('total pe lună: iulie + august = totalul alocat golden (3.881.910,00 kg ± rotunjirea pe clienți)', () => {
    const tot = (m: number) => byMonth(m).raportLuna!.reduce((a, e) => a.plus(e.kg), new Decimal(0));
    expect(tot(7).plus(tot(8)).minus(3881910).abs().lessThanOrEqualTo(0.05)).toBe(true);
    expect(tot(7).greaterThan(0) && tot(8).greaterThan(0)).toBe(true);
  });

  it('lunile raportate nu se schimbă: sesiunea din august păstrează exact valorile din iulie', () => {
    const res = runResult(byMonth(8));
    for (const e of byMonth(7).raportLuna!) {
      const row = res.clienti.find((c) => c.clientId === e.clientId && c.categorie === e.categorie)!;
      expect(row.afisare.alocatLuna['2026-07'].toFixed(2)).toBe(e.kg);
    }
    expect(res.avertizari.some((a) => a.cod === 'A-06')).toBe(false);
  });

  it('septembrie fără colectat nou: alocarea lunii este 0 la toți clienții', () => {
    const sep: AllocationRun = {
      ...byMonth(8),
      id: 'sep',
      luna: 9,
      status: 'draft',
      panaLa: { an: 2026, luna: 9 },
      context: { raportatAnterior: runs.flatMap((r) => r.raportLuna ?? []), ajustariAnterioare: [] },
      raportLuna: undefined,
    };
    const res = runResult(sep);
    expect(res.totalLuna.isZero()).toBe(true);
    expect(res.poateFiTrimisa).toBe(true);
  });

  it('A-06: dacă s-a raportat deja mai mult decât cumulatul, luna primește 0 și sesiunea nu se poate trimite', () => {
    const aug = byMonth(8);
    const novo = seedClients.find((c) => c.denumire === 'NOVO BRANDS SRL')!.id;
    const bad: AllocationRun = {
      ...aug,
      id: 'bad',
      status: 'draft',
      context: { raportatAnterior: [{ clientId: novo, categorie: '2', luna: '2026-07', kg: '500.00' }], ajustariAnterioare: [] },
    };
    const res = runResult(bad);
    const info = res.lunar[`${novo}|2`];
    expect(info.negativ).toBe(true);
    expect(info.lunaCurenta.isZero()).toBe(true);
    expect(res.avertizari.find((a) => a.cod === 'A-06')?.mesaj).toMatch(/NOVO BRANDS SRL/);
    expect(res.verificariRevizuire.find((v) => v.cod === 'R-4')!.trecut).toBe(false);
    expect(res.poateFiTrimisa).toBe(false);
  });
});
